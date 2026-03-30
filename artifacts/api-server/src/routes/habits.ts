import { Router, type IRouter } from "express";
import { db, habitsTable, habitCompletionsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  CreateHabitBody,
  UpdateHabitBody,
  CompleteHabitBody,
  UncompleteHabitBody,
  ListCompletionsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    days.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

async function recalcStreak(habitId: number): Promise<{ streak: number; longestStreak: number; totalCompletions: number }> {
  const completions = await db
    .select({ completedDate: habitCompletionsTable.completedDate })
    .from(habitCompletionsTable)
    .where(eq(habitCompletionsTable.habitId, habitId))
    .orderBy(sql`${habitCompletionsTable.completedDate} DESC`);

  const dates = completions.map((c) => c.completedDate).sort().reverse();
  const totalCompletions = dates.length;

  if (dates.length === 0) return { streak: 0, longestStreak: 0, totalCompletions: 0 };

  let streak = 0;
  let longestStreak = 0;
  let current = 0;
  const today = todayStr();
  let checkDate = today;

  for (const date of dates) {
    if (date === checkDate) {
      streak++;
      current++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split("T")[0];
    } else {
      break;
    }
  }

  // Calculate longest streak
  let tempStreak = 1;
  const sortedDates = [...dates].sort();
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    prev.setDate(prev.getDate() + 1);
    if (prev.toISOString().split("T")[0] === sortedDates[i]) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, 1);

  return { streak, longestStreak, totalCompletions };
}

router.get("/habits", async (req, res) => {
  try {
    const habits = await db.select().from(habitsTable);
    const result = habits.map((h) => ({
      ...h,
      description: h.description ?? null,
      customDays: h.customDays ? JSON.parse(h.customDays) : null,
      createdAt: h.createdAt.toISOString(),
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing habits");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/habits", async (req, res) => {
  try {
    const body = CreateHabitBody.parse(req.body);
    const [habit] = await db.insert(habitsTable).values({
      name: body.name,
      description: body.description ?? null,
      icon: body.icon,
      color: body.color,
      frequency: body.frequency,
      customDays: body.customDays ? JSON.stringify(body.customDays) : null,
      targetCount: body.targetCount,
    }).returning();
    res.status(201).json({
      ...habit,
      description: habit.description ?? null,
      customDays: habit.customDays ? JSON.parse(habit.customDays) : null,
      createdAt: habit.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating habit");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/habits/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = UpdateHabitBody.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.frequency !== undefined) updateData.frequency = body.frequency;
    if (body.customDays !== undefined) updateData.customDays = body.customDays ? JSON.stringify(body.customDays) : null;
    if (body.targetCount !== undefined) updateData.targetCount = body.targetCount;

    const [habit] = await db.update(habitsTable).set(updateData).where(eq(habitsTable.id, id)).returning();
    if (!habit) return res.status(404).json({ error: "Habit not found" });
    res.json({
      ...habit,
      description: habit.description ?? null,
      customDays: habit.customDays ? JSON.parse(habit.customDays) : null,
      createdAt: habit.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error updating habit");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/habits/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(habitsTable).where(eq(habitsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting habit");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/habits/:id/complete", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = CompleteHabitBody.parse(req.body);
    const date = body.date;

    const existing = await db
      .select()
      .from(habitCompletionsTable)
      .where(and(eq(habitCompletionsTable.habitId, id), eq(habitCompletionsTable.completedDate, date)));

    let completion;
    if (existing.length > 0) {
      completion = existing[0];
    } else {
      const [c] = await db.insert(habitCompletionsTable).values({ habitId: id, completedDate: date }).returning();
      completion = c;
    }

    const { streak, longestStreak, totalCompletions } = await recalcStreak(id);
    await db.update(habitsTable).set({ streak, longestStreak, totalCompletions }).where(eq(habitsTable.id, id));

    res.json({
      id: completion.id,
      habitId: completion.habitId,
      completedDate: completion.completedDate,
      createdAt: completion.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error completing habit");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/habits/:id/uncomplete", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = UncompleteHabitBody.parse(req.body);
    const date = body.date;

    await db.delete(habitCompletionsTable).where(
      and(eq(habitCompletionsTable.habitId, id), eq(habitCompletionsTable.completedDate, date))
    );

    const { streak, longestStreak, totalCompletions } = await recalcStreak(id);
    await db.update(habitsTable).set({ streak, longestStreak, totalCompletions }).where(eq(habitsTable.id, id));

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error uncompleting habit");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/completions", async (req, res) => {
  try {
    const query = ListCompletionsQueryParams.parse(req.query);
    const completions = await db
      .select()
      .from(habitCompletionsTable)
      .where(
        and(
          gte(habitCompletionsTable.completedDate, query.from),
          lte(habitCompletionsTable.completedDate, query.to)
        )
      );
    res.json(completions.map((c) => ({
      id: c.id,
      habitId: c.habitId,
      completedDate: c.completedDate,
      createdAt: c.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error listing completions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const today = todayStr();
    const habits = await db.select().from(habitsTable);

    const todayCompletions = await db
      .select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.completedDate, today));
    const completedTodayIds = new Set(todayCompletions.map((c) => c.habitId));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const fromDate = thirtyDaysAgo.toISOString().split("T")[0];
    const last30Days = daysBetween(fromDate, today);

    const allCompletions = await db
      .select()
      .from(habitCompletionsTable)
      .where(gte(habitCompletionsTable.completedDate, fromDate));

    const completionsByHabit = new Map<number, Set<string>>();
    for (const c of allCompletions) {
      if (!completionsByHabit.has(c.habitId)) completionsByHabit.set(c.habitId, new Set());
      completionsByHabit.get(c.habitId)!.add(c.completedDate);
    }

    const longestStreakEver = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);

    const habitStats = habits.map((h) => {
      const doneSet = completionsByHabit.get(h.id) ?? new Set<string>();
      const weeklyData = last30Days.slice(-7).map((date) => ({ date, completed: doneSet.has(date) }));
      const completionRate = last30Days.length > 0 ? Math.round((doneSet.size / last30Days.length) * 100) : 0;
      return {
        habitId: h.id,
        name: h.name,
        icon: h.icon,
        color: h.color,
        streak: h.streak,
        longestStreak: h.longestStreak,
        totalCompletions: h.totalCompletions,
        completionRate,
        weeklyData,
      };
    });

    // AI-style insights
    const insights: string[] = [];
    const completedToday = completedTodayIds.size;
    const totalHabits = habits.length;

    if (totalHabits === 0) {
      insights.push("Comece adicionando seu primeiro hábito! Pequenos passos levam a grandes mudanças.");
    } else {
      if (completedToday === totalHabits) {
        insights.push("Incrível! Você completou todos os hábitos hoje! Continue assim! 🎉");
      } else if (completedToday === 0) {
        insights.push("Ainda dá tempo! Comece com o hábito mais fácil para ganhar momentum.");
      } else {
        insights.push(`Bom progresso! Você completou ${completedToday} de ${totalHabits} hábitos hoje.`);
      }

      const bestStreak = habitStats.reduce((best, h) => h.streak > best.streak ? h : best, habitStats[0]);
      if (bestStreak && bestStreak.streak >= 7) {
        insights.push(`Parabéns! Sua sequência de "${bestStreak.name}" está em ${bestStreak.streak} dias! 🔥`);
      } else if (bestStreak && bestStreak.streak >= 3) {
        insights.push(`Você está em uma sequência de ${bestStreak.streak} dias com "${bestStreak.name}". Não quebre agora!`);
      }

      const lowRate = habitStats.find((h) => h.completionRate < 50 && h.totalCompletions > 0);
      if (lowRate) {
        insights.push(`Dica: tente fazer "${lowRate.name}" em um horário fixo para aumentar a consistência.`);
      }

      const highRate = habitStats.find((h) => h.completionRate >= 80);
      if (highRate) {
        insights.push(`"${highRate.name}" tem ${highRate.completionRate}% de taxa de conclusão. Excelente disciplina!`);
      }
    }

    res.json({
      totalHabits,
      completedToday,
      longestStreakEver,
      insights,
      habitStats,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
