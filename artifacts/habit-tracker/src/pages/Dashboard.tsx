import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { HabitCard } from "@/components/HabitCard";
import { HabitFormDialog } from "@/components/HabitFormDialog";
import { useHabitsData } from "@/hooks/use-habits-data";
import { Habit } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Dashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [currentDate] = useState(new Date());
  
  const { 
    habits, 
    isLoading, 
    completedHabitIds, 
    toggleCompletion, 
    createHabit,
    updateHabit,
    deleteHabit,
    isCreating,
    isUpdating
  } = useHabitsData(currentDate);

  const formattedDate = format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingHabit(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (editingHabit) {
      updateHabit({ id: editingHabit.id, data }, {
        onSuccess: () => setIsDialogOpen(false)
      });
    } else {
      createHabit({ data }, {
        onSuccess: () => setIsDialogOpen(false)
      });
    }
  };

  const progress = habits.length > 0 
    ? Math.round((completedHabitIds.size / habits.length) * 100) 
    : 0;

  return (
    <AppLayout>
      <div className="px-6 py-8 md:p-10 max-w-3xl w-full mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-primary font-semibold text-sm tracking-wider uppercase mb-2"
            >
              {capitalizedDate}
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-5xl font-display font-bold"
            >
              Vamos vencer hoje! 🚀
            </motion.h1>
          </div>

          {habits.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card p-4 rounded-3xl shadow-sm border border-border/50 shrink-0 w-full md:w-48"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">Progresso</span>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                />
              </div>
            </motion.div>
          )}
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <img 
              src={`${import.meta.env.BASE_URL}images/empty-state.png`} 
              alt="Comece a plantar seus hábitos" 
              className="w-64 h-64 object-contain mb-8 opacity-90 drop-shadow-2xl"
            />
            <h2 className="text-2xl font-display font-bold mb-3">Nenhum hábito ainda</h2>
            <p className="text-muted-foreground mb-8 max-w-md text-lg">
              Pequenas mudanças diárias constroem grandes resultados. Crie seu primeiro hábito agora.
            </p>
            <button 
              onClick={handleOpenCreate}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
            >
              <Plus size={24} /> Criar Primeiro Hábito
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => (
              <HabitCard 
                key={habit.id}
                habit={habit}
                isCompleted={completedHabitIds.has(habit.id)}
                onToggle={() => toggleCompletion(habit.id, completedHabitIds.has(habit.id))}
                onEdit={() => handleOpenEdit(habit)}
                onDelete={() => deleteHabit({ id: habit.id })}
              />
            ))}
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={handleOpenCreate}
              className="w-full mt-6 py-5 rounded-3xl border-2 border-dashed border-border text-muted-foreground font-semibold flex items-center justify-center gap-2 hover:bg-secondary hover:text-foreground hover:border-primary/30 transition-all group"
            >
              <Plus className="group-hover:scale-125 transition-transform" /> Adicionar Hábito
            </motion.button>
          </div>
        )}

        <HabitFormDialog 
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleSubmit}
          initialData={editingHabit}
          isLoading={isCreating || isUpdating}
        />
      </div>
    </AppLayout>
  );
}
