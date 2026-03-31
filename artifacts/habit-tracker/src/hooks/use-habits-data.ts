import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  useListHabits,
  useListCompletions,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useCompleteHabit,
  useUncompleteHabit,
  useGetStats,
  getListCompletionsQueryKey,
  getListHabitsQueryKey,
  getGetStatsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { offlineStore, QueuedOp } from "@/lib/offline-storage";
import { Habit, HabitCompletion, CreateHabitRequest, UpdateHabitRequest } from "@workspace/api-client-react/src/generated/api.schemas";

// ── Queue flusher ─────────────────────────────────────────────────────────────
async function flushQueue(
  ops: QueuedOp[],
  mutations: {
    complete: (id: number, date: string) => Promise<void>;
    uncomplete: (id: number, date: string) => Promise<void>;
    create: (payload: any) => Promise<void>;
    del: (id: number) => Promise<void>;
    update: (id: number, payload: any) => Promise<void>;
  }
) {
  for (const op of ops) {
    try {
      if (op.type === "complete") await mutations.complete(op.habitId, op.date);
      else if (op.type === "uncomplete") await mutations.uncomplete(op.habitId, op.date);
      else if (op.type === "create") await mutations.create(op.payload);
      else if (op.type === "delete") await mutations.del(op.habitId);
      else if (op.type === "update") await mutations.update(op.habitId, op.payload);
      offlineStore.dequeue(op.id);
    } catch {
      // Keep in queue for next attempt
    }
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useHabitsData(date: Date = new Date()) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const dateStr = format(date, "yyyy-MM-dd");
  const prevOnlineRef = useRef(isOnline);

  // ── Local (offline) state ──
  const [localHabits, setLocalHabits] = useState<Habit[]>(() => offlineStore.loadHabits());
  const [localCompletions, setLocalCompletions] = useState<HabitCompletion[]>(
    () => offlineStore.loadCompletions(dateStr)
  );

  // ── Server queries ──
  const habitsQuery = useListHabits({ query: { enabled: isOnline, retry: 1 } });
  const completionsQuery = useListCompletions(
    { from: dateStr, to: dateStr },
    { query: { enabled: isOnline, retry: 1 } }
  );

  // ── Persist to localStorage when server responds ──
  useEffect(() => {
    if (habitsQuery.data) {
      offlineStore.saveHabits(habitsQuery.data);
      setLocalHabits(habitsQuery.data);
    }
  }, [habitsQuery.data]);

  useEffect(() => {
    if (completionsQuery.data) {
      offlineStore.saveCompletions(dateStr, completionsQuery.data);
      setLocalCompletions(completionsQuery.data);
    }
  }, [completionsQuery.data, dateStr]);

  // ── Load from localStorage when date changes ──
  useEffect(() => {
    setLocalCompletions(
      completionsQuery.data ?? offlineStore.loadCompletions(dateStr)
    );
  }, [dateStr]);

  // ── Invalidate helpers ──
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListCompletionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  }, [queryClient]);

  // ── Raw mutations (used both directly and by queue flusher) ──
  const completeMut = useCompleteHabit({ mutation: { onSuccess: invalidateAll } });
  const uncompleteMut = useUncompleteHabit({ mutation: { onSuccess: invalidateAll } });
  const createMut = useCreateHabit({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Hábito criado!", description: "Vamos começar essa nova jornada." });
      },
    },
  });
  const updateMut = useUpdateHabit({ mutation: { onSuccess: invalidateAll } });
  const deleteMut = useDeleteHabit({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Hábito excluído" });
      },
    },
  });

  // ── Async wrappers for flusher ──
  const rawMutations = {
    complete: (id: number, d: string) =>
      new Promise<void>((res, rej) =>
        completeMut.mutate({ id, data: { date: d } }, { onSuccess: () => res(), onError: rej })
      ),
    uncomplete: (id: number, d: string) =>
      new Promise<void>((res, rej) =>
        uncompleteMut.mutate({ id, data: { date: d } }, { onSuccess: () => res(), onError: rej })
      ),
    create: (payload: CreateHabitRequest) =>
      new Promise<void>((res, rej) =>
        createMut.mutate({ data: payload }, { onSuccess: () => res(), onError: rej })
      ),
    del: (id: number) =>
      new Promise<void>((res, rej) =>
        deleteMut.mutate({ id }, { onSuccess: () => res(), onError: rej })
      ),
    update: (id: number, payload: UpdateHabitRequest) =>
      new Promise<void>((res, rej) =>
        updateMut.mutate({ id, data: payload }, { onSuccess: () => res(), onError: rej })
      ),
  };

  // ── Flush pending queue when coming back online ──
  useEffect(() => {
    if (isOnline && !prevOnlineRef.current) {
      const queue = offlineStore.getQueue();
      if (queue.length > 0) {
        toast({ title: "Sincronizando...", description: `${queue.length} ação(ões) pendente(s).` });
        flushQueue(queue, rawMutations).then(() => {
          invalidateAll();
          const remaining = offlineStore.getQueue();
          if (remaining.length === 0) {
            toast({ title: "Sincronizado!", description: "Tudo salvo no servidor." });
          }
        });
      }
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  // ── Public toggle (offline-aware) ──
  const toggleCompletion = useCallback(
    (habitId: number, isCompleted: boolean) => {
      if (isOnline) {
        if (isCompleted) {
          uncompleteMut.mutate({ id: habitId, data: { date: dateStr } });
        } else {
          completeMut.mutate({ id: habitId, data: { date: dateStr } });
        }
      } else {
        // Apply locally + enqueue
        if (isCompleted) {
          offlineStore.removeCompletionLocally(dateStr, habitId);
          offlineStore.enqueue({ type: "uncomplete", habitId, date: dateStr });
        } else {
          offlineStore.addCompletionLocally(dateStr, habitId);
          offlineStore.enqueue({ type: "complete", habitId, date: dateStr });
        }
        setLocalCompletions(offlineStore.loadCompletions(dateStr));
        setLocalHabits(offlineStore.loadHabits());
      }
    },
    [isOnline, dateStr]
  );

  // ── Public createHabit (offline-aware) ──
  const createHabit = useCallback(
    (payload: CreateHabitRequest) => {
      if (isOnline) {
        createMut.mutate({ data: payload });
      } else {
        // Add locally with temp ID
        const tempHabit: Habit = {
          id: -Date.now(),
          name: payload.name,
          icon: payload.icon ?? "💧",
          color: payload.color ?? "Indigo",
          frequency: payload.frequency ?? "daily",
          targetCount: payload.targetCount ?? 1,
          streak: 0,
          totalCompletions: 0,
          createdAt: new Date().toISOString(),
        };
        offlineStore.addHabitLocally(tempHabit);
        offlineStore.enqueue({ type: "create", payload });
        setLocalHabits(offlineStore.loadHabits());
        toast({ title: "Hábito salvo localmente", description: "Vai sincronizar quando voltar a internet." });
      }
    },
    [isOnline]
  );

  // ── Public deleteHabit (offline-aware) ──
  const deleteHabit = useCallback(
    ({ id }: { id: number }) => {
      if (isOnline) {
        deleteMut.mutate({ id });
      } else {
        offlineStore.removeHabitLocally(id);
        offlineStore.enqueue({ type: "delete", habitId: id });
        setLocalHabits(offlineStore.loadHabits());
        toast({ title: "Hábito removido localmente" });
      }
    },
    [isOnline]
  );

  // ── Public updateHabit (offline-aware) ──
  const updateHabit = useCallback(
    ({ id, data }: { id: number; data: UpdateHabitRequest }) => {
      if (isOnline) {
        updateMut.mutate({ id, data });
      } else {
        offlineStore.updateHabitLocally(id, data as Partial<Habit>);
        offlineStore.enqueue({ type: "update", habitId: id, payload: data });
        setLocalHabits(offlineStore.loadHabits());
        toast({ title: "Hábito atualizado localmente" });
      }
    },
    [isOnline]
  );

  // ── Derived values ──
  const completedHabitIds = new Set(localCompletions.map(c => c.habitId));

  const isLoading = isOnline
    ? habitsQuery.isLoading || completionsQuery.isLoading
    : false;

  return {
    habits: localHabits,
    isLoading,
    isOnline,
    completedHabitIds,
    toggleCompletion,
    createHabit,
    updateHabit,
    deleteHabit,
    isCreating: createMut.isPending,
    isUpdating: updateMut.isPending,
  };
}

export function useHabitStats() {
  return useGetStats();
}
