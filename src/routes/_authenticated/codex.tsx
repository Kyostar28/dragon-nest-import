import { createFileRoute } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { BookOpen } from "lucide-react";
import { DRAGONS, RARITY_ORDER, RARITY_LABEL } from "@/lib/dragons";
import { DragonAvatar } from "@/components/DragonAvatar";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/codex")({
  component: CodexPage,
});

function CodexPage() {
  const [selected, setSelected] = useState(1);
  const dragon = DRAGONS[selected];
  const [rarity, setRarity] = useState<typeof RARITY_ORDER[number]>("common");

  return (
    <div className="min-h-screen bg-grid">
      <GameHeader />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-display text-glow">CODEX DE DRAGONES</h1>
          <span className="ml-auto text-xs text-muted-foreground font-mono">{Object.keys(DRAGONS).length} especies</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 p-4 rounded-xl border border-border bg-card/40">
            {Object.entries(DRAGONS).map(([id, d]) => (
              <button
                key={id}
                onClick={() => setSelected(Number(id))}
                className={cn(
                  "p-3 rounded-lg border bg-background/40 flex flex-col items-center gap-2 transition",
                  Number(id) === selected ? "border-primary shadow-[0_0_18px_rgba(74,222,128,0.35)]" : "border-border hover:border-primary/40",
                )}
              >
                <DragonAvatar catalogId={Number(id)} rarity="common" size="sm" />
                <span className="text-[10px] font-display tracking-wider text-center mt-2 truncate w-full">{d.name.replace(" Dragon", "")}</span>
              </button>
            ))}
          </div>

          <aside className="p-6 rounded-xl border border-primary/30 bg-card/60 backdrop-blur shadow-[var(--shadow-card)] space-y-4">
            <div className="flex flex-col items-center">
              <DragonAvatar catalogId={selected} rarity={rarity} size="lg" />
            </div>
            <div className="text-center mt-4">
              <h2 className="font-display text-xl text-glow">{dragon?.name}</h2>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">#{String(selected).padStart(3, "0")} · {dragon?.slug}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Vista por rareza</p>
              <div className="flex flex-wrap gap-1.5">
                {RARITY_ORDER.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRarity(r)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] uppercase tracking-wider border font-display",
                      r === rarity ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {RARITY_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
