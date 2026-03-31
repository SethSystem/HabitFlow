import { Habit, HabitCompletion } from "@workspace/api-client-react/src/generated/api.schemas";

const K = {
  habits: "hf:habits",
  comp: (date: string) => `hf:comp:${date}`,
  queue: "hf:queue",
};

export type QueuedOp =
  | { id: string; ts: number; type: "complete"; habitId: number; date: string }
  | { id: string; ts: number; type: "uncomplete"; habitId: number; date: string }
  | { id: string; ts: number; type: "create"; payload: any }
  | { id: string; ts: number; type: "delete"; habitId: number }
  | { id: string; ts: number; type: "update"; habitId: number; payload: any };

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const offlineStore = {
  // ── Habits ──────────────────────────────────────────
  saveHabits(habits: Habit[]) {
    write(K.habits, habits);
  },
  loadHabits(): Habit[] {
    return read<Habit[]>(K.habits, []);
  },
  updateHabitLocally(id: number, patch: Partial<Habit>) {
    const habits = this.loadHabits().map(h => h.id === id ? { ...h, ...patch } : h);
    this.saveHabits(habits);
  },
  addHabitLocally(habit: Habit) {
    const habits = this.loadHabits();
    this.saveHabits([...habits, habit]);
  },
  removeHabitLocally(id: number) {
    this.saveHabits(this.loadHabits().filter(h => h.id !== id));
    // Remove all cached completions for this habit (by removing nothing — they carry habitId)
  },

  // ── Completions ──────────────────────────────────────
  saveCompletions(date: string, completions: HabitCompletion[]) {
    write(K.comp(date), completions);
  },
  loadCompletions(date: string): HabitCompletion[] {
    return read<HabitCompletion[]>(K.comp(date), []);
  },
  addCompletionLocally(date: string, habitId: number) {
    const existing = this.loadCompletions(date);
    if (existing.find(c => c.habitId === habitId)) return;
    const fake: HabitCompletion = {
      id: -Date.now(),
      habitId,
      completedDate: date,
      createdAt: new Date().toISOString(),
    };
    this.saveCompletions(date, [...existing, fake]);
    // Update streak locally
    const habits = this.loadHabits();
    const h = habits.find(x => x.id === habitId);
    if (h) this.updateHabitLocally(habitId, {
      streak: h.streak + 1,
      totalCompletions: h.totalCompletions + 1,
    });
  },
  removeCompletionLocally(date: string, habitId: number) {
    const filtered = this.loadCompletions(date).filter(c => c.habitId !== habitId);
    this.saveCompletions(date, filtered);
    // Update streak locally
    const habits = this.loadHabits();
    const h = habits.find(x => x.id === habitId);
    if (h) this.updateHabitLocally(habitId, {
      streak: Math.max(0, h.streak - 1),
      totalCompletions: Math.max(0, h.totalCompletions - 1),
    });
  },

  // ── Queue ────────────────────────────────────────────
  getQueue(): QueuedOp[] {
    return read<QueuedOp[]>(K.queue, []);
  },
  enqueue(op: Omit<QueuedOp, "id" | "ts">) {
    const q = this.getQueue();
    const newOp = { ...op, id: `q_${Date.now()}_${Math.random()}`, ts: Date.now() } as QueuedOp;
    write(K.queue, [...q, newOp]);
  },
  dequeue(id: string) {
    write(K.queue, this.getQueue().filter(op => op.id !== id));
  },
  clearQueue() {
    localStorage.removeItem(K.queue);
  },
};
