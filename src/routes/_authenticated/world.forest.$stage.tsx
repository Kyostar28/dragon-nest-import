import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchZones, fetchStages, fetchMobs, fetchSpells, fetchProgress, setProgress, gainXp, type Mob, type Spell } from "@/lib/world";
import { fetchAllUserData } from "@/lib/game";
import { supabase } from "@/integrations/supabase/client";
import { computeStats, ELEMENT_ICON, ELEMENT_LABEL, type DragonElement } from "@/lib/stats";
import { DragonAvatar } from "@/components/DragonAvatar";
import { Button } from "@/components/ui/button";
import { dragonName, type Rarity } from "@/lib/dragons";
import { Heart, Zap, Shield, Swords, Crown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/world/forest/$stage")({
  component: BattlePage,
});

const TURN_SECONDS = 30;
const NEXT_MOB_SECONDS = 3;

type CatalogRow = { id: number; element: DragonElement; base_hp: number; base_ap: number; base_defense: number; base_crit: number };

async function fetchCatalogStats(): Promise<CatalogRow[]> {
  const { data, error } = await supabase
    .from("dragons_catalog").select("id, element, base_hp, base_ap, base_defense, base_crit").order("id");
  if (error) throw error;
  return data as CatalogRow[];
}

function pickN<T>(arr: T[], n: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(Math.random() * arr.length)]);
  return out;
}

function BattlePage() {
  const { stage } = Route.useParams();
  const stageNum = Number(stage);
  const { session } = useAuth();
  const userId = session!.user.id;
  const nav = useNavigate();

  const zonesQ = useQuery({ queryKey: ["zones"], queryFn: fetchZones });
  const forest = zonesQ.data?.find((z) => z.slug === "forest");
  const stagesQ = useQuery({ queryKey: ["stages", forest?.id], queryFn: () => fetchStages(forest!.id), enabled: !!forest });
  const mobsQ = useQuery({ queryKey: ["mobs"], queryFn: fetchMobs });
  const dataQ = useQuery({ queryKey: ["userdata", userId], queryFn: () => fetchAllUserData(userId) });
  const catQ = useQuery({ queryKey: ["catstats"], queryFn: fetchCatalogStats });

  const stageRow = stagesQ.data?.find((s) => s.stage_number === stageNum);
  const dragons = (dataQ.data?.dragons ?? []).filter((d) => !d.placed_in_nest);

  const [pickedDragonId, setPickedDragonId] = useState<string | null>(null);

  if (!stageRow || !mobsQ.data || !catQ.data) {
    return (
      <div className="min-h-screen bg-grid"><GameHeader /><p className="container mx-auto p-10 text-muted-foreground">Cargando…</p></div>
    );
  }

  if (!pickedDragonId) {
    return (
      <div className="min-h-screen bg-grid">
        <GameHeader />
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <Link to="/world/forest" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4">
            <ChevronLeft className="w-4 h-4" />Volver
          </Link>
          <h1 className="font-display text-2xl text-glow mb-2">Etapa 1-{stageNum}</h1>
          <p className="text-sm text-muted-foreground mb-6">Elige el dragón con el que entrarás al combate.</p>
          {dragons.length === 0 && <p className="text-rose-400">No tienes dragones disponibles.</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {dragons.map((d) => {
              const cat = catQ.data!.find((c) => c.id === d.catalog_id);
              const stats = cat ? computeStats(cat, d.rarity as Rarity, d.level ?? 1) : null;
              return (
                <button
                  key={d.id}
                  onClick={() => setPickedDragonId(d.id)}
                  className="p-3 rounded-xl border border-border hover:border-primary/60 bg-card/40 hover:bg-card/70 transition flex flex-col items-center gap-2"
                >
                  <DragonAvatar catalogId={d.catalog_id} rarity={d.rarity as Rarity} size="md" />
                  <span className="text-xs font-display mt-2 truncate w-full text-center">{dragonName(d.catalog_id).replace(" Dragon","")}</span>
                  <span className="text-[10px] text-muted-foreground">Lv {d.level ?? 1}</span>
                  {stats && (
                    <span className="text-[10px] text-muted-foreground flex gap-2">
                      <span>❤{stats.hp}</span><span>⚡{stats.ap}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const dragon = dragons.find((d) => d.id === pickedDragonId)!;
  const cat = catQ.data!.find((c) => c.id === dragon.catalog_id)!;

  const mobSequence = useMemo<Mob[]>(() => {
    const pool = mobsQ.data!.filter((m) => !m.is_boss);
    const seq = pickN(pool, 2);
    if (stageRow.has_boss && stageRow.boss_mob_id) {
      const boss = mobsQ.data!.find((m) => m.id === stageRow.boss_mob_id);
      if (boss) seq.push(boss);
    } else {
      seq.push(pickN(pool, 1)[0]);
    }
    return seq;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedDragonId, stageRow.id]);

  return (
    <Arena
      userId={userId}
      stageId={stageRow.id}
      stageNum={stageNum}
      zoneId={forest!.id}
      dragon={dragon}
      cat={cat}
      mobSequence={mobSequence}
      onExit={() => nav({ to: "/world/forest" })}
    />
  );
}

function Arena({
  userId, stageId, stageNum, zoneId, dragon, cat, mobSequence, onExit,
}: {
  userId: string;
  stageId: number;
  stageNum: number;
  zoneId: number;
  dragon: { id: string; catalog_id: number; rarity: string; level: number | null };
  cat: CatalogRow;
  mobSequence: Mob[];
  onExit: () => void;
}) {
  const stats = useMemo(() => computeStats(cat, dragon.rarity as Rarity, dragon.level ?? 1), [cat, dragon]);
  const spellsQ = useQuery({ queryKey: ["spells", cat.element], queryFn: () => fetchSpells(cat.element) });
  const spells = (spellsQ.data ?? []).filter((s) => s.min_level <= (dragon.level ?? 1));

  const [mobIndex, setMobIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(stats.hp);
  const [playerAp, setPlayerAp] = useState(stats.ap);
  const mob = mobSequence[mobIndex];
  const [mobHp, setMobHp] = useState(mob.hp);
  const [turn, setTurn] = useState<"player" | "mob" | "between" | "won" | "lost">("player");
  const [turnLeft, setTurnLeft] = useState(TURN_SECONDS);
  const [betweenLeft, setBetweenLeft] = useState(NEXT_MOB_SECONDS);
  const [log, setLog] = useState<string[]>([`Inicia el combate vs ${mob.name}.`]);

  const addLog = (m: string) => setLog((l) => [...l.slice(-30), m]);
  const turnRef = useRef(turn);
  turnRef.current = turn;

  // Reset mob HP when index changes
  useEffect(() => {
    if (mobIndex < mobSequence.length) {
      setMobHp(mobSequence[mobIndex].hp);
    }
  }, [mobIndex, mobSequence]);

  // Player turn timer
  useEffect(() => {
    if (turn !== "player") return;
    setTurnLeft(TURN_SECONDS);
    const iv = setInterval(() => {
      setTurnLeft((t) => {
        if (t <= 1) { clearInterval(iv); endTurn(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, mobIndex]);

  // Between-mob countdown
  useEffect(() => {
    if (turn !== "between") return;
    setBetweenLeft(NEXT_MOB_SECONDS);
    const iv = setInterval(() => {
      setBetweenLeft((t) => {
        if (t <= 1) {
          clearInterval(iv);
          const next = mobIndex + 1;
          if (next >= mobSequence.length) {
            handleWin();
          } else {
            setMobIndex(next);
            addLog(`Aparece ${mobSequence[next].name}.`);
            setPlayerAp(stats.ap);
            setTurn("player");
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn]);

  const handleWin = async () => {
    setTurn("won");
    addLog("¡Victoria!");
    toast.success(`¡Etapa 1-${stageNum} completada!`);
    try {
      const cur = await fetchProgress(userId, zoneId);
      if (stageNum + 1 > cur && stageNum < 20) {
        await setProgress(userId, zoneId, Math.min(20, stageNum + 1));
      }
      await gainXp(dragon.id, userId, 50 + stageNum * 25);
    } catch {}
  };

  const handleLose = () => {
    setTurn("lost");
    addLog("Tu dragón ha caído…");
    toast.error("Has sido derrotado");
  };

  const dealToMob = (dmg: number, name: string) => {
    const isCrit = Math.random() * 100 < stats.crit;
    const final = Math.max(1, Math.round(dmg * (isCrit ? 2 : 1) - mob.defense * 0.3));
    addLog(`Tu dragón usa ${name} → ${final}${isCrit ? " ¡CRÍTICO!" : ""}`);
    setMobHp((h) => {
      const nh = h - final;
      if (nh <= 0) {
        addLog(`${mob.name} derrotado.`);
        if (mobIndex + 1 >= mobSequence.length) {
          // last mob
          setTimeout(() => handleWin(), 400);
        } else {
          addLog(`Siguiente enemigo en ${NEXT_MOB_SECONDS}s…`);
          setTurn("between");
        }
        return 0;
      }
      return nh;
    });
  };

  const basicAttack = () => {
    if (turn !== "player") return;
    if (playerAp < 2) { toast.error("PA insuficiente"); return; }
    setPlayerAp((a) => a - 2);
    dealToMob(stats.attack, "Ataque básico");
  };

  const castSpell = (s: Spell) => {
    if (turn !== "player") return;
    if (playerAp < s.ap_cost) { toast.error("PA insuficiente"); return; }
    setPlayerAp((a) => a - s.ap_cost);
    dealToMob(s.damage + Math.round(stats.attack * 0.3), s.name);
  };

  const endTurn = () => {
    if (turnRef.current !== "player") return;
    setTurn("mob");
    setTimeout(() => {
      const isCrit = Math.random() * 100 < mob.crit;
      const dmg = Math.max(1, Math.round(mob.attack * (isCrit ? 2 : 1) - stats.defense * 0.3));
      addLog(`${mob.name} ataca → ${dmg}${isCrit ? " ¡CRÍTICO!" : ""}`);
      setPlayerHp((h) => {
        const nh = h - dmg;
        if (nh <= 0) { setTimeout(() => handleLose(), 300); return 0; }
        return nh;
      });
      setTimeout(() => {
        if (turnRef.current === "mob") {
          setPlayerAp(stats.ap);
          setTurn("player");
        }
      }, 700);
    }, 600);
  };

  const isOver = turn === "won" || turn === "lost";

  return (
    <div className="min-h-screen bg-grid">
      <GameHeader />
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <Link to="/world/forest" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <ChevronLeft className="w-4 h-4" />Salir
          </Link>
          <span className="text-xs text-muted-foreground font-mono">
            Turno: <span className="text-foreground">{turn === "player" ? `Jugador · ${turnLeft}s` : turn === "mob" ? "Enemigo" : turn === "between" ? `Próximo en ${betweenLeft}s` : turn}</span>
          </span>
        </div>

        {/* Battle scene */}
        <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-b from-card/60 to-card/20 backdrop-blur p-6 mb-4 min-h-[280px]">
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-card/80 border border-border text-[10px] uppercase tracking-widest">
            Etapa 1-{stageNum} · Mob {mobIndex + 1}/3
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mt-8">
            {/* Player */}
            <div className="flex items-center gap-4">
              <DragonAvatar catalogId={dragon.catalog_id} rarity={dragon.rarity as Rarity} size="lg" />
              <div className="flex-1">
                <p className="font-display text-glow truncate">{dragonName(dragon.catalog_id).replace(" Dragon","")}</p>
                <p className="text-[10px] text-muted-foreground">Lv {dragon.level ?? 1} · {ELEMENT_ICON[cat.element]} {ELEMENT_LABEL[cat.element]}</p>
                <Bar label="HP" cur={playerHp} max={stats.hp} color="bg-emerald-500" icon={<Heart className="w-3 h-3" />} />
                <Bar label="PA" cur={playerAp} max={stats.ap} color="bg-cyan-500" icon={<Zap className="w-3 h-3" />} />
              </div>
            </div>

            {/* Mob */}
            <div className="flex items-center gap-4 sm:flex-row-reverse text-right">
              <div className={cn(
                "w-28 h-28 rounded-full border-4 flex items-center justify-center text-5xl bg-card/80",
                mob.is_boss ? "border-yellow-500/70 shadow-[0_0_30px_rgba(234,179,8,0.5)]" : "border-rose-500/60",
              )}>
                {mob.icon ?? "👹"}
              </div>
              <div className="flex-1">
                <p className="font-display text-glow flex items-center gap-1 sm:justify-end">
                  {mob.is_boss && <Crown className="w-4 h-4 text-yellow-400" />}
                  {mob.name}
                </p>
                <p className="text-[10px] text-muted-foreground">Lv {mob.level} · {ELEMENT_ICON[mob.element]}</p>
                <Bar label="HP" cur={mobHp} max={mob.hp} color={mob.is_boss ? "bg-yellow-500" : "bg-rose-500"} icon={<Heart className="w-3 h-3" />} reverse />
              </div>
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="rounded-xl border border-border bg-background/40 p-3 mb-4 h-32 overflow-y-auto text-xs space-y-1 font-mono">
          {log.map((l, i) => <p key={i}>▸ {l}</p>)}
        </div>

        {/* Actions */}
        {isOver ? (
          <div className="text-center p-6 rounded-xl border border-primary/30 bg-card/60">
            <h2 className="font-display text-2xl text-glow mb-3">{turn === "won" ? "¡VICTORIA!" : "DERROTA"}</h2>
            <Button onClick={onExit}>Volver al bosque</Button>
          </div>
        ) : (
          <>
            <Button
              onClick={basicAttack}
              disabled={turn !== "player"}
              className="w-full h-14 text-base bg-rose-600 hover:bg-rose-500"
            >
              <Swords className="w-4 h-4 mr-2" />ATACAR (2 PA)
            </Button>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {spells.map((s) => (
                <button
                  key={s.id}
                  onClick={() => castSpell(s)}
                  disabled={turn !== "player" || playerAp < s.ap_cost}
                  className="p-2 rounded-lg border border-border bg-card/60 hover:bg-card text-left disabled:opacity-40"
                >
                  <p className="text-xs font-display flex items-center gap-1">{s.icon} {s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.ap_cost} PA · {s.damage} dmg</p>
                </button>
              ))}
            </div>
            <button
              onClick={endTurn}
              disabled={turn !== "player"}
              className="w-full mt-3 py-2 text-xs uppercase tracking-widest border border-border rounded-lg text-muted-foreground hover:text-foreground"
            >
              ↩ Terminar turno
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Bar({ label, cur, max, color, icon, reverse }: { label: string; cur: number; max: number; color: string; icon: React.ReactNode; reverse?: boolean }) {
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));
  return (
    <div className="mt-1.5">
      <div className="h-2 rounded-full bg-background/60 overflow-hidden border border-border">
        <div className={cn("h-full transition-all", color)} style={{ width: `${pct}%`, marginLeft: reverse ? `${100 - pct}%` : 0 }} />
      </div>
      <p className={cn("text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1", reverse && "justify-end")}>
        {icon}{label} {cur}/{max}
      </p>
    </div>
  );
}
