import { Link } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <div className="text-8xl font-display font-bold text-primary/20 mb-6">404</div>
        <h2 className="text-3xl font-display font-bold mb-4">Página não encontrada</h2>
        <p className="text-muted-foreground mb-8 text-lg max-w-md">
          Parece que você se perdeu no caminho. Vamos voltar e focar nos seus hábitos.
        </p>
        <Link href="/">
          <div className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex items-center gap-2 cursor-pointer">
            <Home size={24} /> Voltar ao Início
          </div>
        </Link>
      </div>
    </AppLayout>
  );
}
