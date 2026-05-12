import { createFileRoute } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { BookOpen, Heart, Zap, Shield, Crosshair, Swords } from "lucide-react";
import { DRAGONS, RARITY_ORDER, RARITY_LABEL, type Rarity } from "@/lib/dragons";
import { DragonAvatar } from "@/components/DragonAvatar";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { fetchAllUserData } from "@/lib/game";
import { supabase } from "@/integrations/supabase/client";
import { computeStats, ELEMENT_ICON, ELEMENT_LABEL, ELEMENT_COLOR, type DragonElement } from "@/lib/stats";

export const Route = createFileRoute("/_authenticated/codex")({ component: CodexPage });

async function fetchCatalogFull() {
  const { data, error } = await supabase
    .from("dragons_catalog")
    .select("id, element, base_hp, base_ap, base_defense, base_crit")
    .order("id");
  if (error) throw error;
  return data as Array<{ id: number; element: DragonElement; base_hp: number; base_ap: number; base_defense: number; base_crit: number }>;
}

function CodexPage() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [selected, setSelected] = useState(1);
  const [rarity, setRarity] = useState<Rarity>("common");

  const dataQ = useQuery({ queryKey: ["userdata", userId], queryFn: () => fetchAllUserData(userId) });
  const catQ = useQuery({ queryKey: ["catalog-full"], queryFn: fetchCatalogFull });

  const owned = new Set((dataQ.data?.dragons ?? []).map((d) => d.catalog_id));
  const dragon = DRAGONS[selected];
  const cat = catQ.data?.find((c) => c.id === selected);
  const stats = cat ? computeStats(cat, rarity, 1) : null;

  return (
    <div className="min-h-screen bg-grid">
      <GameHeader />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-display text-glow">CODEX DE DRAGONES</h1>
          <span className="ml-auto text-xs text-muted-foreground font-mono">
            {owned.size}/{Object.keys(DRAGONS).length} descubiertos
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 p-4 rounded-xl border border-border bg-card/40">
            {Object.entries(DRAGONS).map(([id, d]) => {
              const nid = Number(id);
              const isOwned = owned.has(nid);
              return (
                <button
                  key={id}
                  onClick={() => setSelected(nid)}
                  className={cn(
                    "p-3 rounded-lg border bg-background/40 flex flex-col items-center gap-2 transition relative",
                    nid === selected ? "border-primary shadow-[0_0_18px_rgba(74,222,128,0.35)]" : "border-border hover:border-primary/40",
                    !isOwned && "grayscale opacity-40",
                  )}
                >
                  <DragonAvatar catalogId={nid} rarity="common" size="sm" />
                  <span className="text-[10px] font-display tracking-wider text-center mt-2 truncate w-full">
                    {d.name.replace(" Dragon", "")}
                  </span>
                  {!isOwned && (
                    <span className="absolute top-1 right-1 text-[8px] uppercase bg-background/80 px-1 rounded">?</span>
                  )}
                </button>
              );
            })}
          </div>

          <aside className="p-6 rounded-xl border border-primary/30 bg-card/60 backdrop-blur shadow-[var(--shadow-card)] space-y-4">
            <div className="flex flex-col items-center">
              <div className={cn(!owned.has(selected) && "grayscale opacity-50")}>
                <DragonAvatar catalogId={selected} rarity={rarity} size="lg" />
              </div>
            </div>
            <div className="text-center mt-4">
              <h2 className="font-display text-xl text-glow">{dragon?.name}</h2>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                #{String(selected).padStart(3, "0")} · {dragon?.slug}
              </p>
              {cat && (
                <p className={cn("text-sm mt-2 font-display", ELEMENT_COLOR[cat.element])}>
                  {ELEMENT_ICON[cat.element]} {ELEMENT_LABEL[cat.element]}
                </p>
              )}
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

            {stats && (
              <div className="space-y-2 pt-3 border-t border-border">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Stats base (Lv 1)</p>
                <StatRow icon={<Heart className="w-3.5 h-3.5 text-rose-400" />} label="Vida" value={stats.hp} />
                <StatRow icon={<Zap className="w-3.5 h-3.5 text-cyan-400" />} label="PA" value={stats.ap} />
                <StatRow icon={<Swords className="w-3.5 h-3.5 text-orange-400" />} label="Ataque" value={stats.attack} />
                <StatRow icon={<Shield className="w-3.5 h-3.5 text-blue-400" />} label="Defensa" value={stats.defense} />
                <StatRow icon={<Crosshair className="w-3.5 h-3.5 text-yellow-400" />} label="Crítico %" value={stats.crit} />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2 text-muted-foreground">{icon}{label}</span>
      <span className="font-display text-foreground">{value}</span>
    </div>
  );
}
