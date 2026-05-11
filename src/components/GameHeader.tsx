import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { fetchProfile } from "@/lib/game";
import { Button } from "@/components/ui/button";
import { LogOut, Sprout, Heart, Store, Swords, BookOpen, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

function shortAddr(a: string) {
  if (!a) return "";
  if (a.length <= 14) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

const navItems = [
  { to: "/farm", label: "Farm", icon: Sprout },
  { to: "/breed", label: "Breed", icon: Heart },
  { to: "/marketplace", label: "Market", icon: Store },
  { to: "/arena", label: "Arena", icon: Swords },
  { to: "/codex", label: "Codex", icon: BookOpen },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

export function GameHeader() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const userId = session?.user.id;
  const profileQ = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });
  const profile = profileQ.data;

  return (
    <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-30 bg-background/70">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 gap-4 flex-wrap">
        <button onClick={() => navigate({ to: "/farm" })} className="flex items-center gap-3 shrink-0">
          <div className="relative w-8 h-8 rotate-45 rounded-md bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
            <div className="absolute inset-1 rounded-sm bg-background flex items-center justify-center -rotate-45">
              <span className="font-display text-primary text-xs">D</span>
            </div>
          </div>
          <span className="font-display text-sm tracking-widest text-glow hidden sm:inline">DRACOS · ETC</span>
        </button>

        <nav className="flex items-center gap-1 order-3 lg:order-2 w-full lg:w-auto justify-center overflow-x-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display tracking-wider uppercase",
                "text-muted-foreground hover:text-primary hover:bg-primary/10 transition",
              )}
              activeProps={{ className: "text-primary bg-primary/15 shadow-[0_0_12px_rgba(74,222,128,0.25)]" }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-xs order-2 lg:order-3">
          <div className="px-3 py-1.5 rounded-md border border-border bg-card/60 hidden md:block">
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
  );
}
