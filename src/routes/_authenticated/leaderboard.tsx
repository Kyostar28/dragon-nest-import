import { createFileRoute } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { Trophy, Medal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: LeaderboardPage,
});

async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from("profiles")
    .select("wallet_address, draco_points_total, etc_balance")
    .order("draco_points_total", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

function shortAddr(a: string) {
  if (!a) return "—";
  if (a.length <= 14) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function LeaderboardPage() {
  const q = useQuery({ queryKey: ["leaderboard"], queryFn: fetchLeaderboard, refetchInterval: 30000 });

  return (
    <div className="min-h-screen bg-grid">
      <GameHeader />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-display text-glow">LEADERBOARD GLOBAL</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
          Ranking de los entrenadores con más Draco Points acumulados de toda la historia.
        </p>

        <div className="rounded-xl border border-border bg-card/60 backdrop-blur overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_140px_140px] gap-4 px-5 py-3 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-display">
            <span>Rank</span>
            <span>Wallet</span>
            <span className="text-right">Draco Points</span>
            <span className="text-right">ETC</span>
          </div>
          {q.isLoading && <div className="px-5 py-8 text-center text-muted-foreground">Cargando…</div>}
          {q.data?.length === 0 && <div className="px-5 py-8 text-center text-muted-foreground">Sin datos aún.</div>}
          {q.data?.map((row, i) => (
            <div
              key={row.wallet_address + i}
              className={cn(
                "grid grid-cols-[60px_1fr_140px_140px] gap-4 px-5 py-3 border-b border-border/50 items-center text-sm",
                i < 3 && "bg-primary/5",
              )}
            >
              <span className="flex items-center gap-2 font-display">
                {i < 3 ? (
                  <Medal className={cn("w-4 h-4", i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : "text-amber-700")} />
                ) : (
                  <span className="text-muted-foreground">#{i + 1}</span>
                )}
                {i < 3 && <span>#{i + 1}</span>}
              </span>
              <span className="font-mono text-xs">{shortAddr(row.wallet_address)}</span>
              <span className="text-right font-mono text-primary">{Number(row.draco_points_total ?? 0).toLocaleString()}</span>
              <span className="text-right font-mono text-accent-foreground">{Number(row.etc_balance ?? 0).toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
