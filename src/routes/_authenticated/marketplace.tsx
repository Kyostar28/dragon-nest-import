import { createFileRoute } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { Store } from "lucide-react";
import { DRAGONS } from "@/lib/dragons";
import { DragonAvatar } from "@/components/DragonAvatar";

export const Route = createFileRoute("/_authenticated/marketplace")({
  component: MarketplacePage,
});

function MarketplacePage() {
  const sample = Object.values(DRAGONS).slice(0, 8);
  return (
    <div className="min-h-screen bg-grid">
      <GameHeader />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Store className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-display text-glow">MARKETPLACE</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
          Compra y vende dragones, huevos y nidos directamente con otros jugadores usando ETC. Las comisiones del market alimentan el reward pool.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sample.map((d, i) => (
            <div key={d.slug} className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur flex flex-col items-center gap-3">
              <DragonAvatar catalogId={i + 1} rarity="common" size="lg" />
              <div className="mt-3 text-center">
                <p className="font-display text-sm">{d.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Próximamente</p>
              </div>
              <button disabled className="w-full mt-2 py-2 rounded-md border border-primary/40 bg-primary/10 text-primary text-xs font-display tracking-wider opacity-50 cursor-not-allowed">
                — ETC
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
