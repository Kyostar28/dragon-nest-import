import { createFileRoute, Link } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { useQuery } from "@tanstack/react-query";
import { fetchZones } from "@/lib/world";
import { Globe, Shield, Swords } from "lucide-react";

export const Route = createFileRoute("/_authenticated/world")({ component: WorldPage });

function WorldPage() {
  const zonesQ = useQuery({ queryKey: ["zones"], queryFn: fetchZones });
  const zones = zonesQ.data ?? [];

  return (
    <div className="min-h-screen bg-grid">
      <GameHeader />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-display text-glow">MUNDO</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Elige una zona para explorar.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((z) => {
            const isSafe = z.kind === "safe";
            const Icon = isSafe ? Shield : Swords;
            const tone = isSafe ? "border-emerald-500/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]"
              : "border-rose-500/40 hover:shadow-[0_0_24px_rgba(244,63,94,0.25)]";
            const Wrap: any = isSafe ? "div" : Link;
            const wrapProps = isSafe ? {} : { to: "/world/forest" };
            return (
              <Wrap
                key={z.id}
                {...wrapProps}
                className={`block p-6 rounded-xl border bg-card/40 transition cursor-${isSafe ? "default" : "pointer"} ${tone}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={isSafe ? "text-emerald-400" : "text-rose-400"} />
                  <h2 className="font-display text-xl">{z.name}</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{z.description}</p>
                <span className={`inline-block text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                  isSafe ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
                }`}>
                  {isSafe ? "Zona segura" : "PvE · 20 etapas"}
                </span>
              </Wrap>
            );
          })}
        </div>
      </div>
    </div>
  );
}
