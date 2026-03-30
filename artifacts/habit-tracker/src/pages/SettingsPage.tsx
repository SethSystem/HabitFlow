import { AppLayout } from "@/components/AppLayout";
import { Moon, Sun, Smartphone, Bell, Heart, Github } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check current theme
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    }

    // PWA install prompt logic
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <AppLayout>
      <div className="px-6 py-8 md:p-10 max-w-2xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-4xl font-display font-bold text-foreground">Ajustes</h1>
          <p className="text-muted-foreground mt-2 text-lg">Personalize sua experiência.</p>
        </header>

        <div className="space-y-6">
          <section className="glass-card rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-secondary/20">
              <h2 className="font-semibold text-sm tracking-wide text-muted-foreground uppercase">Aparência & App</h2>
            </div>
            <div className="divide-y divide-border/50">
              <SettingRow 
                icon={theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                title="Modo Escuro"
                description="Alternar tema do aplicativo"
                action={
                  <div 
                    className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-secondary'}`}
                    onClick={toggleTheme}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                }
              />
              <SettingRow 
                icon={<Smartphone size={20} />}
                title="Instalar App"
                description="Use offline como um app nativo"
                action={
                  <Button 
                    variant="outline" 
                    className="rounded-xl"
                    onClick={handleInstallClick}
                    disabled={!deferredPrompt}
                  >
                    {deferredPrompt ? "Instalar" : "Instalado"}
                  </Button>
                }
              />
            </div>
          </section>

          <section className="glass-card rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-secondary/20">
              <h2 className="font-semibold text-sm tracking-wide text-muted-foreground uppercase">Sobre</h2>
            </div>
            <div className="divide-y divide-border/50">
              <SettingRow 
                icon={<Heart size={20} className="text-rose-500" />}
                title="Construído com Replit"
                description="Agente de IA Frontend"
              />
              <SettingRow 
                icon={<Github size={20} />}
                title="Versão"
                description="v1.0.0 Offline-first PWA"
              />
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function SettingRow({ icon, title, description, action }: any) {
  return (
    <div className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground shrink-0">
          {icon}
        </div>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
