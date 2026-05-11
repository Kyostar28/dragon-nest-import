import { createFileRoute } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { Swords, Shield, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/arena")({
  component: ArenaPage,
});

function ArenaPage() {
  return (
    <div className="min-h-screen bg-grid">
      <GameHeader />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Swords className="w-6 h-6 text-destructive" />
          <h1 className="text-3xl font-display text-glow">ARENA · PVP</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
          Enfrenta a otros entrenadores en combates 3v3 por turnos. Sube de rango y gana ETC y huevos legendarios.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Swords, label: "Modo Ranked", desc: "Sube en el ladder global por temporada." },
            { icon: Shield, label: "Modo Casual", desc: "Practica sin perder rating." },
            { icon: Zap, label: "Torneos", desc: "Premios semanales en ETC." },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur">
              <Icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-display tracking-wider text-sm mb-1">{label}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <div className="p-8 rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 text-center">
          <p className="text-sm uppercase tracking-widest text-destructive font-display">Próximamente</p>
          <p className="mt-2 text-xs text-muted-foreground">El sistema de combate PvP se activará en la fase 2.</p>
        </div>
      </div>
    </div>
  );
}
