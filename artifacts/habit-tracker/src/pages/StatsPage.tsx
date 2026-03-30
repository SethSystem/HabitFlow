import { AppLayout } from "@/components/AppLayout";
import { useHabitStats } from "@/hooks/use-habits-data";
import { Flame, Trophy, CheckCircle2, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StatsPage() {
  const { data: stats, isLoading } = useHabitStats();

  // Process data for a beautiful chart of the top performing habit
  const topHabit = stats?.habitStats.sort((a, b) => b.completionRate - a.completionRate)[0];
  
  const chartData = topHabit?.weeklyData.map(d => ({
    name: format(parseISO(d.date), 'EE', { locale: ptBR }).substring(0, 3),
    completed: d.completed ? 1 : 0
  })) || [];

  return (
    <AppLayout>
      <div className="px-6 py-8 md:p-10 max-w-4xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-4xl font-display font-bold text-foreground">Estatísticas</h1>
          <p className="text-muted-foreground mt-2 text-lg">Seus números e insights gerados por IA.</p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-card rounded-3xl animate-pulse" />
            <div className="h-32 bg-card rounded-3xl animate-pulse" />
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Top Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                icon={<CheckCircle2 className="text-emerald-500" />} 
                title="Hoje" 
                value={stats?.completedToday?.toString() || "0"} 
                subtitle="Hábitos concluídos"
                color="bg-emerald-500/10"
              />
              <StatCard 
                icon={<Flame className="text-orange-500" />} 
                title="Melhor" 
                value={stats?.longestStreakEver?.toString() || "0"} 
                subtitle="Dias seguidos"
                color="bg-orange-500/10"
              />
              <StatCard 
                icon={<Trophy className="text-amber-500" />} 
                title="Total" 
                value={stats?.totalHabits?.toString() || "0"} 
                subtitle="Hábitos ativos"
                color="bg-amber-500/10"
              />
              <StatCard 
                icon={<TrendingUp className="text-primary" />} 
                title="Taxa" 
                value={`${topHabit ? Math.round(topHabit.completionRate * 100) : 0}%`} 
                subtitle="No seu melhor hábito"
                color="bg-primary/10"
              />
            </div>

            {/* AI Insights */}
            {stats?.insights && stats.insights.length > 0 && (
              <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/10">
                <h3 className="font-display font-bold text-xl mb-4 text-primary flex items-center gap-2">
                  <span className="text-2xl">✨</span> Insights Inteligentes
                </h3>
                <ul className="space-y-3">
                  {stats.insights.map((insight, idx) => (
                    <li key={idx} className="flex gap-3 text-foreground/80 leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chart Area */}
            {topHabit && (
              <div className="glass-card rounded-3xl p-6">
                <div className="mb-8">
                  <h3 className="font-display font-bold text-xl">Progresso: {topHabit.name}</h3>
                  <p className="text-muted-foreground">Últimos dias do seu hábito mais forte</p>
                </div>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                        dy={10}
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-foreground text-background px-3 py-2 rounded-xl text-sm font-medium shadow-xl">
                                {payload[0].value ? "Concluído" : "Não concluído"}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="completed" 
                        fill="hsl(var(--primary))" 
                        radius={[6, 6, 6, 6]} 
                        barSize={32}
                        animationDuration={1000}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, title, value, subtitle, color }: any) {
  return (
    <div className="glass-card p-5 rounded-3xl flex flex-col justify-between items-start gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-display font-bold mb-1">{value}</p>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
