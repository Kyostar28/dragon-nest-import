import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchAllUserData, fetchCatalog, fetchProfile, fetchActivePool,
  fetchPoolContribution, fetchUserRewards,
  depositEggsToPool, eggDPValue,
  placeNestInSlot, removeNestFromSlot, placeDragonInNest,
  removeDragonFromNest, markEggReady, claimDragonEggs, fuseDragons, fuseNests,
  unlockSlot, SLOT_COST, buyDragonEgg, DRAGON_EGG_PRICE_ETC,
  type DBDragon, type DBNest, type DBEgg, type CatalogRow,
} from "@/lib/game";
import { DRAGONS, EGGS_PER_NEST, RARITY_LABEL, formatDuration, type Rarity } from "@/lib/dragons";
import { DragonAvatar } from "@/components/DragonAvatar";
import { NestVisual } from "@/components/NestVisual";
import { EggVisual } from "@/components/EggVisual";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Lock, Plus, Sparkles, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/farm")({
  component: FarmPage,
});

function FarmPage() {
  const { session, signOut } = useAuth();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const profileQ = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId) });
  const catalogQ = useQuery({ queryKey: ["catalog"], queryFn: fetchCatalog });
  const dataQ = useQuery({ queryKey: ["userdata", userId], queryFn: () => fetchAllUserData(userId), refetchInterval: 5000 });
  const poolQ = useQuery({ queryKey: ["pool"], queryFn: fetchActivePool, refetchInterval: 30000 });
  const contribQ = useQuery({
    queryKey: ["contrib", poolQ.data?.id, userId],
    queryFn: () => fetchPoolContribution(userId, poolQ.data!.id),
    enabled: !!poolQ.data,
  });
  const rewardsQ = useQuery({ queryKey: ["rewards", userId], queryFn: () => fetchUserRewards(userId) });

  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ["userdata", userId] });
    qc.invalidateQueries({ queryKey: ["profile", userId] });
    qc.invalidateQueries({ queryKey: ["pool"] });
    qc.invalidateQueries({ queryKey: ["contrib"] });
    qc.invalidateQueries({ queryKey: ["rewards", userId] });
  };

  // Tick to update timers and auto-mark egg ready
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const catalogById = useMemo(() => {
    const m = new Map<number, CatalogRow>();
    (catalogQ.data ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [catalogQ.data]);

  // Auto mark egg_ready when farming time elapsed
  useEffect(() => {
    const dragons = dataQ.data?.dragons ?? [];
    for (const d of dragons) {
      if (d.placed_in_nest && d.farming_started_at && !d.egg_ready) {
        const cat = catalogById.get(d.catalog_id);
        if (!cat) continue;
        const elapsed = (now - new Date(d.farming_started_at).getTime()) / 1000;
        if (elapsed >= cat.interval_seconds) {
          markEggReady(d.id, userId).then(() => qc.invalidateQueries({ queryKey: ["userdata", userId] })).catch(() => {});
        }
      }
    }
  }, [now, dataQ.data, catalogById, userId, qc]);

  const dragons = dataQ.data?.dragons ?? [];
  const nests = dataQ.data?.nests ?? [];
  const eggs = dataQ.data?.eggs ?? [];
  const unlocked = dataQ.data?.unlockedSlots ?? new Set<number>();

  const profile = profileQ.data;
  const pool = poolQ.data;
  const contrib = contribQ.data ?? 0;

  const poolEndsIn = pool ? Math.max(0, Math.floor((new Date(pool.period_end).getTime() - now) / 1000)) : 0;

  // Modal: choose nest to place
  const [pickSlot, setPickSlot] = useState<number | null>(null);
  // Modal: choose dragon to place in nest
  const [pickNest, setPickNest] = useState<DBNest | null>(null);

  const idleNests = nests.filter((n) => n.slot_index === null);
  const idleDragons = dragons.filter((d) => !d.placed_in_nest);

  // map slot_index -> nest in that slot
  const nestBySlot = new Map<number, DBNest>();
  nests.forEach((n) => { if (n.slot_index !== null) nestBySlot.set(n.slot_index, n); });
  // dragon by nest id
  const dragonByNest = new Map<string, DBDragon>();
  dragons.forEach((d) => { if (d.placed_in_nest) dragonByNest.set(d.placed_in_nest, d); });

  // ----- handlers -----
  const wrap = async (fn: () => Promise<unknown>, msg?: string) => {
    try { await fn(); if (msg) toast.success(msg); refetchAll(); }
    catch (e: any) { toast.error(e?.message ?? "Error"); }
  };

  const handleDepositEggs = (eggsToDeposit: DBEgg[]) => wrap(async () => {
    if (!pool) throw new Error("No hay pool activo");
    const r = await depositEggsToPool({ eggs: eggsToDeposit, catalogById, pool, userId });
    toast.success(`Depositaste ${r.count} huevos · +${r.points} DP al pool`);
  });

  const handlePlaceNest = (nestId: string) => wrap(async () => {
    if (pickSlot === null) return;
    await placeNestInSlot(nestId, pickSlot, userId);
    setPickSlot(null);
  }, "Nido colocado");

  const handlePlaceDragon = (dragonId: string) => wrap(async () => {
    if (!pickNest) return;
    await placeDragonInNest(dragonId, pickNest.id, userId);
    setPickNest(null);
  }, "Dragón farmando");

  const handleClaim = (d: DBDragon, nest: DBNest) => wrap(async () => {
    const cat = catalogById.get(d.catalog_id)!;
    const r = await claimDragonEggs({ dragon: d, nestRarity: nest.rarity, catalog: cat, userId });
    toast.success(`+${r.count} huevos al inventario`);
  });

  const handleUnlockSlot = (i: number) => wrap(async () => {
    await unlockSlot(i, userId);
  }, `Slot ${i} desbloqueado`);

  const handleFuseDragons = (a: DBDragon, b: DBDragon) => wrap(async () => {
    await fuseDragons(a, b, userId);
  }, "¡Fusión exitosa!");

  const handleFuseNests = (a: DBNest, b: DBNest) => wrap(async () => {
    await fuseNests(a, b, userId);
  }, "¡Nidos fusionados!");

  const handleRemoveNest = (n: DBNest) => wrap(async () => {
    await removeNestFromSlot(n.id, userId);
  }, "Nido recogido");

  const handleRemoveDragon = (d: DBDragon) => wrap(async () => {
    await removeDragonFromNest(d.id, userId);
  }, "Dragón retirado");

  const handleBuyDragonEgg = () => wrap(async () => {
    const r = await buyDragonEgg(userId, catalogQ.data ?? []);
    toast.success(`¡Eclosionó un ${DRAGONS[r.catalog.id]?.name ?? "Dragón"} (común)!`);
  });

  return (
    <div className="min-h-screen bg-grid">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-30 bg-background/70">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rotate-45 rounded-md bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
              <div className="absolute inset-1 rounded-sm bg-background flex items-center justify-center -rotate-45">
                <span className="font-display text-primary text-xs">D</span>
              </div>
            </div>
            <span className="font-display text-sm tracking-widest text-glow hidden sm:inline">DRACOS · ETC</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-md border border-border bg-card/60">
              <span className="text-muted-foreground">Wallet · </span>
              <span className="font-mono">{shortAddr(profile?.wallet_address ?? "")}</span>
            </div>
            <div className="px-3 py-1.5 rounded-md border border-accent/40 bg-accent/10 text-accent-foreground">
              <span className="font-display">{Number(profile?.etc_balance ?? 0).toFixed(4)}</span> ETC
            </div>
            <div className="px-3 py-1.5 rounded-md border border-primary/40 bg-primary/10 text-primary">
              <span className="font-display">{(profile?.draco_points_total ?? 0).toLocaleString()}</span> DP
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Map */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display text-glow">Mapa de Farm</h2>
            <span className="text-xs text-muted-foreground">{unlocked.size}/30 slots desbloqueados</span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 p-4 rounded-xl border border-border bg-card/40">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((i) => {
              const isUnlocked = unlocked.has(i);
              const nest = nestBySlot.get(i);
              const dragon = nest ? dragonByNest.get(nest.id) : undefined;
              const cat = dragon ? catalogById.get(dragon.catalog_id) : undefined;
              const elapsed = dragon?.farming_started_at
                ? (now - new Date(dragon.farming_started_at).getTime()) / 1000
                : 0;
              const remaining = cat ? Math.max(0, Math.floor(cat.interval_seconds - elapsed)) : 0;
              const pct = cat ? Math.min(100, (elapsed / cat.interval_seconds) * 100) : 0;
              const ready = dragon?.egg_ready;

              return (
                <div key={i} className={cn(
                  "relative aspect-square rounded-lg border flex items-center justify-center transition",
                  isUnlocked ? "border-primary/30 bg-background/40" : "border-border bg-muted/20",
                )}>
                  <span className="absolute top-1 left-1.5 text-[10px] text-muted-foreground font-mono">#{i}</span>
                  {!isUnlocked && (
                    <button
                      onClick={() => handleUnlockSlot(i)}
                      className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition"
                      title={`Desbloquear por ${SLOT_COST} DP`}
                    >
                      <Lock className="w-5 h-5" />
                      <span className="text-[10px]">{SLOT_COST} DP</span>
                    </button>
                  )}
                  {isUnlocked && !nest && (
                    <button
                      onClick={() => setPickSlot(i)}
                      disabled={idleNests.length === 0}
                      className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary disabled:opacity-30"
                      title="Colocar nido"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-[10px]">Nido</span>
                    </button>
                  )}
                  {isUnlocked && nest && !dragon && (
                    <div className="flex flex-col items-center gap-1">
                      <NestVisual rarity={nest.rarity} size="sm" />
                      <button
                        onClick={() => setPickNest(nest)}
                        disabled={idleDragons.length === 0}
                        className="text-[10px] text-primary hover:underline disabled:opacity-30 mt-2"
                      >
                        + Dragón
                      </button>
                      <button
                        onClick={() => handleRemoveNest(nest)}
                        className="text-[9px] text-muted-foreground hover:text-destructive"
                      >
                        recoger
                      </button>
                    </div>
                  )}
                  {isUnlocked && nest && dragon && cat && (
                    <div className="flex flex-col items-center gap-1 w-full px-1">
                      <DragonAvatar catalogId={dragon.catalog_id} rarity={dragon.rarity} size="sm" ready={ready} />
                      <div className="w-full mt-2 h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{ready ? "¡Listo!" : formatDuration(remaining)}</span>
                      {ready ? (
                        <button onClick={() => handleClaim(dragon, nest)} className="text-[10px] text-primary font-semibold hover:underline">Reclamar</button>
                      ) : (
                        <button onClick={() => handleRemoveDragon(dragon)} className="text-[9px] text-muted-foreground hover:text-destructive">retirar</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Reward pool */}
          <div className="p-5 rounded-xl border border-primary/30 bg-card/60 backdrop-blur shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-display tracking-wider text-sm">REWARD POOL</h3>
            </div>
            <p className="mt-3 text-3xl font-display text-primary text-glow">
              {pool ? Number(pool.total_etc).toFixed(4) : "0.0100"} <span className="text-sm">ETC</span>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-background/50">
                <div className="text-muted-foreground">Cierra en</div>
                <div className="font-mono text-foreground">{formatDuration(poolEndsIn)}</div>
              </div>
              <div className="p-2 rounded bg-background/50">
                <div className="text-muted-foreground">Tu DP</div>
                <div className="font-mono text-primary">{contrib.toLocaleString()}</div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Las recompensas se reparten proporcionalmente a los Draco Points contribuidos en este periodo.
            </p>
            {(rewardsQ.data?.length ?? 0) > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Tus últimas recompensas</div>
                <ul className="space-y-1 text-xs">
                  {rewardsQ.data!.slice(0, 5).map((r: any) => (
                    <li key={r.pool_id} className="flex justify-between">
                      <span className="font-mono text-muted-foreground">Pool #{r.pool_id}</span>
                      <span className="text-primary font-mono">{Number(r.etc_amount).toFixed(6)} ETC</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Shop */}
          <div className="p-5 rounded-xl border border-accent/40 bg-card/60 backdrop-blur shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-accent" />
              <h3 className="font-display tracking-wider text-sm">SHOP</h3>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-display">Huevo de Dragón</p>
                <p className="text-[11px] text-muted-foreground">Eclosiona un dragón común aleatorio.</p>
              </div>
              <EggVisual rarity="common" />
            </div>
            <Button
              onClick={handleBuyDragonEgg}
              disabled={Number(profile?.etc_balance ?? 0) < DRAGON_EGG_PRICE_ETC}
              className="w-full mt-4"
            >
              Comprar · {DRAGON_EGG_PRICE_ETC} ETC
            </Button>
            <p className="mt-2 text-[10px] text-muted-foreground text-center">
              Saldo: {Number(profile?.etc_balance ?? 0).toFixed(4)} ETC
            </p>
          </div>

          {/* Inventory */}
          <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur">
            <h3 className="font-display tracking-wider text-sm mb-3">INVENTARIO</h3>
            <Tabs defaultValue="dragons">
              <TabsList className="w-full">
                <TabsTrigger value="dragons" className="flex-1">Dragones ({idleDragons.length})</TabsTrigger>
                <TabsTrigger value="nests" className="flex-1">Nidos ({idleNests.length})</TabsTrigger>
                <TabsTrigger value="eggs" className="flex-1">Huevos ({eggs.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="dragons" className="mt-3">
                <DragonsInventory dragons={idleDragons} onFuse={handleFuseDragons} />
              </TabsContent>
              <TabsContent value="nests" className="mt-3">
                <NestsInventory nests={idleNests} onFuse={handleFuseNests} />
              </TabsContent>
              <TabsContent value="eggs" className="mt-3">
                <EggsInventory eggs={eggs} catalogById={catalogById} onDeposit={handleDepositEggs} hasPool={!!pool} />
              </TabsContent>
            </Tabs>
          </div>
        </aside>
      </div>

      {/* Pick nest modal */}
      <Dialog open={pickSlot !== null} onOpenChange={(o) => !o && setPickSlot(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Elige un nido para el slot #{pickSlot}</DialogTitle></DialogHeader>
          {idleNests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes nidos libres. Fusiona o adquiere más.</p>
          ) : (
            <div className="grid grid-cols-3 gap-4 pt-4">
              {idleNests.map((n) => (
                <button key={n.id} onClick={() => handlePlaceNest(n.id)} className="flex flex-col items-center gap-2 hover:scale-105 transition">
                  <NestVisual rarity={n.rarity} />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pick dragon modal */}
      <Dialog open={!!pickNest} onOpenChange={(o) => !o && setPickNest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elige un dragón para el nido {pickNest && RARITY_LABEL[pickNest.rarity]}</DialogTitle>
          </DialogHeader>
          {idleDragons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes dragones libres.</p>
          ) : (
            <div className="grid grid-cols-3 gap-4 pt-4">
              {idleDragons.map((d) => {
                const cat = catalogById.get(d.catalog_id);
                return (
                  <button key={d.id} onClick={() => handlePlaceDragon(d.id)} className="flex flex-col items-center gap-2 hover:scale-105 transition">
                    <DragonAvatar catalogId={d.catalog_id} rarity={d.rarity} />
                    <span className="text-[10px] text-muted-foreground">
                      ⏱ {formatDuration(cat?.interval_seconds ?? 0)} · {pickNest ? EGGS_PER_NEST[pickNest.rarity] : 0} 🥚
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function shortAddr(a: string) {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

function DragonsInventory({ dragons, onFuse }: { dragons: DBDragon[]; onFuse: (a: DBDragon, b: DBDragon) => void }) {
  if (dragons.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">No tienes dragones libres. Abre huevos o retira dragones del mapa.</p>;
  // group by catalog+rarity
  const groups = new Map<string, DBDragon[]>();
  dragons.forEach((d) => {
    const k = `${d.catalog_id}-${d.rarity}`;
    const arr = groups.get(k) ?? [];
    arr.push(d);
    groups.set(k, arr);
  });
  return (
    <div className="grid grid-cols-3 gap-4 pt-2">
      {Array.from(groups.entries()).map(([k, arr]) => {
        const d = arr[0];
        const canFuse = arr.length >= 2 && d.rarity !== "legendary";
        return (
          <div key={k} className="flex flex-col items-center gap-2 relative">
            <DragonAvatar catalogId={d.catalog_id} rarity={d.rarity} />
            {arr.length > 1 && (
              <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">×{arr.length}</span>
            )}
            <span className="text-[10px] text-center text-muted-foreground">{DRAGONS[d.catalog_id]?.name}</span>
            {canFuse && (
              <button onClick={() => onFuse(arr[0], arr[1])} className="text-[10px] text-primary hover:underline">⚗ Fusionar</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NestsInventory({ nests, onFuse }: { nests: DBNest[]; onFuse: (a: DBNest, b: DBNest) => void }) {
  if (nests.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">No tienes nidos libres.</p>;
  const groups = new Map<Rarity, DBNest[]>();
  nests.forEach((n) => {
    const arr = groups.get(n.rarity) ?? [];
    arr.push(n);
    groups.set(n.rarity, arr);
  });
  return (
    <div className="grid grid-cols-3 gap-4 pt-2">
      {Array.from(groups.entries()).map(([r, arr]) => {
        const canFuse = arr.length >= 2 && r !== "legendary";
        return (
          <div key={r} className="flex flex-col items-center gap-2 relative">
            <NestVisual rarity={r} />
            {arr.length > 1 && (
              <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">×{arr.length}</span>
            )}
            {canFuse && (
              <button onClick={() => onFuse(arr[0], arr[1])} className="text-[10px] text-primary hover:underline mt-2">⚗ Fusionar</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EggsInventory({
  eggs, catalogById, onDeposit, hasPool,
}: {
  eggs: DBEgg[];
  catalogById: Map<number, CatalogRow>;
  onDeposit: (eggs: DBEgg[]) => void;
  hasPool: boolean;
}) {
  if (eggs.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">No tienes huevos. Coloca dragones para producir.</p>;
  const groups = new Map<string, DBEgg[]>();
  eggs.forEach((e) => {
    const k = `${e.catalog_id}-${e.rarity}`;
    const arr = groups.get(k) ?? [];
    arr.push(e);
    groups.set(k, arr);
  });

  const totalDP = eggs.reduce((s, e) => {
    const cat = catalogById.get(e.catalog_id);
    return cat ? s + eggDPValue(cat, e.rarity) : s;
  }, 0);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">Total: <span className="text-primary font-mono">{totalDP.toLocaleString()} DP</span></span>
        <button
          onClick={() => onDeposit(eggs)}
          disabled={!hasPool}
          className="text-[11px] px-2 py-1 rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30"
        >
          Depositar todo al pool
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from(groups.entries()).map(([k, arr]) => {
          const e = arr[0];
          const cat = catalogById.get(e.catalog_id);
          const unit = cat ? eggDPValue(cat, e.rarity) : 0;
          return (
            <div key={k} className="flex flex-col items-center gap-1 relative p-2 rounded border border-border bg-background/40">
              <EggVisual rarity={e.rarity} size="md" />
              {arr.length > 1 && (
                <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">×{arr.length}</span>
              )}
              <span className="text-[10px] text-center text-muted-foreground leading-tight">{DRAGONS[e.catalog_id]?.name}</span>
              <span className="text-[10px] text-primary font-mono">{unit} DP</span>
              <button
                onClick={() => onDeposit(arr)}
                disabled={!hasPool}
                className="text-[10px] text-primary hover:underline disabled:opacity-30"
              >
                Depositar ({arr.length})
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
