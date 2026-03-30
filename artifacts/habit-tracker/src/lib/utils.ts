import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate nice soft colors based on a seed or preset
export const HABIT_COLORS = [
  { name: "Indigo", value: "bg-indigo-500 text-indigo-500 bg-indigo-500/10" },
  { name: "Rose", value: "bg-rose-500 text-rose-500 bg-rose-500/10" },
  { name: "Emerald", value: "bg-emerald-500 text-emerald-500 bg-emerald-500/10" },
  { name: "Amber", value: "bg-amber-500 text-amber-500 bg-amber-500/10" },
  { name: "Sky", value: "bg-sky-500 text-sky-500 bg-sky-500/10" },
  { name: "Fuchsia", value: "bg-fuchsia-500 text-fuchsia-500 bg-fuchsia-500/10" },
];

export const COMMON_EMOJIS = [
  "💧", "🏃", "🧘", "📚", "🥗", "😴", 
  "🏋️", "🎨", "💊", "🍎", "📱", "🧹",
  "💻", "🎸", "🚶", "🚭", "🧠", "🦷"
];
