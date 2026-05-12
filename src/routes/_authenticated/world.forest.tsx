import { createFileRoute, Link } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { fetchZones, fetchStages, fetchProgress } from "@/lib/world";
import { Lock, Crown, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/world/forest")({ component: ForestPage });

function ForestPage() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const zonesQ = useQuery({ queryKey: ["zones"], queryFn: fetchZones });
  const forest = zonesQ.data?.find((z) => z.slug === "forest");
  const stagesQ = useQuery({
    queryKey: ["stages", forest?.id],
    queryFn: () => fetchStages(forest!.id),
    enabled: !!forest,
  });
  const progressQ = useQuery({
    queryKey: ["progress", userId, forest?.id],
    queryFn: () => fetchProgress(userId, forest!.id),
    enabled: !!forest,
  });

  const maxUnlocked = progressQ.data ?? 1;
  const stages = stagesQ.data ?? [];

  return (
    <div className="min-h-screen bg-grid">
      <GameHeader />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="w-6 h-6 text-rose-400" />
          <h1 className="text-3xl font-display text-glow">BOSQUE VERDE</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          20 etapas. 3 enemigos por etapa. La etapa 1-20 contiene un jefe élite.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {stages.map((s) => {
            const locked = s.stage_number > maxUnlocked;
            const isBoss = s.has_boss;
            return (
              <div key={s.id}>
                {locked ? (
                  <div className="p-4 rounded-xl border border-border bg-card/30 flex flex-col items-center gap-2 opacity-60">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <span className="font-display text-sm">1-{s.stage_number}</span>
                    <span className="text-[9px] uppercase text-muted-foreground">Bloqueado</span>
                  </div>
                ) : (
                  <Link
                    to="/world/forest/$stage"
                    params={{ stage: String(s.stage_number) }}
                    className={cn(
                      "block p-4 rounded-xl border bg-card/50 hover:bg-card/80 transition flex flex-col items-center gap-2",
                      isBoss ? "border-yellow-500/60 hover:shadow-[0_0_22px_rgba(234,179,8,0.4)]"
                             : "border-primary/40 hover:shadow-[0_0_18px_rgba(74,222,128,0.3)]",
                    )}
                  >
                    {isBoss ? <Crown className="w-5 h-5 text-yellow-400" /> : <Swords className="w-5 h-5 text-primary" />}
                    <span className="font-display text-sm">1-{s.stage_number}</span>
                    <span className="text-[9px] uppercase text-muted-foreground">
                      {isBoss ? "Jefe Élite" : "3 mobs"}
                    </span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
