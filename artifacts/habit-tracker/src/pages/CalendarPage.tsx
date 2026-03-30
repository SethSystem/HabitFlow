import { AppLayout } from "@/components/AppLayout";
import { useHabitStats } from "@/hooks/use-habits-data";
import { format, subDays, isSameDay, startOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const { data: stats, isLoading } = useHabitStats();

  // Generate last 30 days for a simple heatmap approach
  const today = new Date();
  const days = Array.from({ length: 30 }).map((_, i) => subDays(today, 29 - i));

  return (
    <AppLayout>
      <div className="px-6 py-8 md:p-10 max-w-4xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-4xl font-display font-bold text-foreground">Calendário</h1>
          <p className="text-muted-foreground mt-2 text-lg">Acompanhe sua consistência ao longo do tempo.</p>
        </header>

        {isLoading ? (
          <div className="h-64 bg-card rounded-3xl animate-pulse" />
        ) : (
          <div className="space-y-8">
            {stats?.habitStats.map(habit => (
              <div key={habit.habitId} className="glass-card p-6 rounded-3xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-xl">
                    {habit.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">{habit.name}</h3>
                    <p className="text-sm text-muted-foreground">Taxa de conclusão: {Math.round(habit.completionRate * 100)}%</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCompleted = habit.weeklyData.find(d => d.date === dateStr)?.completed;
                    const isToday = isSameDay(day, today);

                    return (
                      <div 
                        key={dateStr}
                        className="group relative"
                      >
                        <div 
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] transition-all duration-300",
                            isCompleted 
                              ? "bg-primary shadow-sm shadow-primary/30 text-primary-foreground" 
                              : "bg-secondary text-muted-foreground/30",
                            isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          )}
                        >
                          {format(day, 'd')}
                        </div>
                        {/* Simple tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {format(day, "d 'de' MMM", { locale: ptBR })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {stats?.habitStats.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                Nenhum dado de calendário disponível ainda.
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
