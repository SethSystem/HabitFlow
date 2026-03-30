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
  getGetStatsQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useHabitsData(date: Date = new Date()) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dateStr = format(date, 'yyyy-MM-dd');

  // Fetch all habits
  const habitsQuery = useListHabits();

  // Fetch completions for the specific date
  const completionsQuery = useListCompletions({ from: dateStr, to: dateStr });
  
  // Setup mutations with optimistic invalidation
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListCompletionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const createMut = useCreateHabit({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Hábito criado!", description: "Vamos começar essa nova jornada." });
      },
      onError: (err) => toast({ title: "Erro", description: "Não foi possível criar o hábito.", variant: "destructive" })
    }
  });

  const updateMut = useUpdateHabit({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Hábito atualizado!" });
      },
    }
  });

  const deleteMut = useDeleteHabit({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Hábito excluído" });
      },
    }
  });

  const completeMut = useCompleteHabit({
    mutation: {
      onSuccess: () => invalidateAll(),
    }
  });

  const uncompleteMut = useUncompleteHabit({
    mutation: {
      onSuccess: () => invalidateAll(),
    }
  });

  const toggleCompletion = (habitId: number, isCompleted: boolean) => {
    if (isCompleted) {
      uncompleteMut.mutate({ id: habitId, data: { date: dateStr } });
    } else {
      completeMut.mutate({ id: habitId, data: { date: dateStr } });
    }
  };

  const completedHabitIds = new Set(
    completionsQuery.data?.map(c => c.habitId) || []
  );

  return {
    habits: habitsQuery.data || [],
    isLoading: habitsQuery.isLoading || completionsQuery.isLoading,
    completedHabitIds,
    toggleCompletion,
    createHabit: createMut.mutate,
    updateHabit: updateMut.mutate,
    deleteHabit: deleteMut.mutate,
    isCreating: createMut.isPending,
    isUpdating: updateMut.isPending,
  };
}

export function useHabitStats() {
  return useGetStats();
}
