import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, MoreHorizontal } from "lucide-react";
import { Habit } from "@workspace/api-client-react/src/generated/api.schemas";
import { cn, HABIT_COLORS } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitCard({ habit, isCompleted, onToggle, onEdit, onDelete }: HabitCardProps) {
  // Find color classes or fallback to indigo
  const colorObj = HABIT_COLORS.find(c => c.name === habit.color) || HABIT_COLORS[0];
  const colorClasses = colorObj.value.split(' ');
  const bgClass = colorClasses[2]; // e.g. bg-indigo-500/10
  const textClass = colorClasses[1]; // e.g. text-indigo-500
  const solidBgClass = colorClasses[0]; // e.g. bg-indigo-500

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "group relative p-5 rounded-3xl transition-all duration-300 glass-card flex items-center justify-between gap-4 overflow-hidden",
        isCompleted ? "opacity-75" : "hover:shadow-xl"
      )}
    >
      {/* Background Completion Fill Animation */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn("absolute inset-0 origin-right opacity-[0.03]", solidBgClass)}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 relative z-10 flex-1 min-w-0">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-colors", bgClass)}>
          {habit.icon}
        </div>
        
        <div className="flex flex-col min-w-0 flex-1">
          <h3 className={cn(
            "font-display font-semibold text-lg truncate transition-all",
            isCompleted ? "text-muted-foreground line-through decoration-2 decoration-muted-foreground/30" : "text-foreground"
          )}>
            {habit.name}
          </h3>
          
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
              <Flame size={12} fill="currentColor" />
              <span>{habit.streak}</span>
            </div>
            
            {habit.targetCount > 1 && (
              <div className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                Meta: {habit.targetCount}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 relative z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden">
              <MoreHorizontal size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl">
            <DropdownMenuItem onClick={onEdit} className="rounded-xl cursor-pointer">Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive rounded-xl cursor-pointer">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={onToggle}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 border-2",
            isCompleted 
              ? cn(solidBgClass, "border-transparent text-white shadow-md", `shadow-${habit.color.toLowerCase()}-500/30`)
              : "border-border hover:border-primary/50 text-transparent hover:bg-secondary"
          )}
        >
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check size={24} strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}
