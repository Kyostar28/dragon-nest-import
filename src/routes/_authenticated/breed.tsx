import { createFileRoute } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { Heart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/breed")({
  component: BreedPage,
});

function BreedPage() {
  return (
    <div className="min-h-screen bg-grid">
      <GameHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/40 mb-6">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-display text-glow mb-3">SISTEMA DE BREED</h1>
          <p className="text-muted-foreground mb-10">
            Combina dos dragones de tu colección para criar una nueva especie con rasgos heredados de ambos padres.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="aspect-square rounded-xl border-2 border-dashed border-primary/40 bg-card/40 flex flex-col items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Padre 1</span>
              <span className="text-[10px] text-muted-foreground">Selecciona un dragón</span>
            </div>
            <div className="aspect-square rounded-xl border-2 border-dashed border-accent/40 bg-card/40 flex flex-col items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Padre 2</span>
              <span className="text-[10px] text-muted-foreground">Selecciona un dragón</span>
            </div>
          </div>

          <p className="mt-10 text-xs text-muted-foreground uppercase tracking-widest">
            Próximamente · El sistema de cría estará disponible en la siguiente actualización.
          </p>
        </div>
      </div>
    </div>
  );
}
