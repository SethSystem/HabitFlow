import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Calendar as CalendarIcon, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", icon: Home, label: "Hoje" },
  { href: "/calendar", icon: CalendarIcon, label: "Calendário" },
  { href: "/stats", icon: BarChart2, label: "Estatísticas" },
  { href: "/settings", icon: Settings, label: "Ajustes" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row max-w-7xl mx-auto">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 px-4 py-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20 text-white font-display font-bold text-xl">
            H
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">HabitFlow</h1>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href} className="outline-none">
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium cursor-pointer",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                      initial={false}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-[88px] md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass pb-safe z-50 px-6 py-3 flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href} className="outline-none">
              <div className="flex flex-col items-center justify-center gap-1 w-16 cursor-pointer relative">
                {isActive && (
                  <motion.div 
                    layoutId="mobile-active"
                    className="absolute inset-0 bg-primary/10 rounded-2xl -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
