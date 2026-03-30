import { useState, useEffect } from "react";
import { Habit, CreateHabitRequest, HabitFrequency } from "@workspace/api-client-react/src/generated/api.schemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HABIT_COLORS, COMMON_EMOJIS, cn } from "@/lib/utils";

interface HabitFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHabitRequest) => void;
  initialData?: Habit | null;
  isLoading?: boolean;
}

export function HabitFormDialog({ isOpen, onClose, onSubmit, initialData, isLoading }: HabitFormDialogProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💧");
  const [color, setColor] = useState("Indigo");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [targetCount, setTargetCount] = useState("1");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setIcon(initialData.icon);
        setColor(initialData.color);
        setFrequency(initialData.frequency);
        setTargetCount(initialData.targetCount.toString());
      } else {
        setName("");
        setIcon("💧");
        setColor("Indigo");
        setFrequency("daily");
        setTargetCount("1");
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name,
      icon,
      color,
      frequency,
      targetCount: parseInt(targetCount, 10) || 1
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="bg-muted/30 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">
                {initialData ? "Editar Hábito" : "Novo Hábito"}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground ml-1">Nome do Hábito</Label>
              <Input 
                autoFocus
                placeholder="Ex: Beber água, Ler 10 páginas..." 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="h-14 rounded-2xl text-lg px-4 bg-secondary/50 border-transparent focus-visible:bg-background transition-colors"
                maxLength={40}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground ml-1">Ícone</Label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {COMMON_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={cn(
                      "w-12 h-12 shrink-0 rounded-2xl text-2xl flex items-center justify-center transition-all",
                      icon === emoji 
                        ? "bg-primary/20 border-2 border-primary scale-110" 
                        : "bg-secondary/50 hover:bg-secondary border-2 border-transparent"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground ml-1">Cor</Label>
              <div className="flex gap-3">
                {HABIT_COLORS.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    className={cn(
                      "w-10 h-10 rounded-full transition-all ring-offset-2 ring-offset-background",
                      c.value.split(' ')[0], // Extracts the solid bg class
                      color === c.name ? "ring-2 ring-primary scale-110" : "hover:scale-105"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground ml-1">Frequência</Label>
                <Select value={frequency} onValueChange={(v: HabitFrequency) => setFrequency(v)}>
                  <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekdays">Dias Úteis</SelectItem>
                    <SelectItem value="weekends">Finais de Semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground ml-1">Vezes ao dia</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={targetCount} 
                  onChange={e => setTargetCount(e.target.value)}
                  className="h-12 rounded-xl bg-secondary/50 border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="p-6 pt-2">
            <Button 
              type="submit" 
              disabled={!name.trim() || isLoading}
              className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all"
            >
              {isLoading ? "Salvando..." : (initialData ? "Salvar Alterações" : "Criar Hábito")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
