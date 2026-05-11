import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isValidEtcAddress } from "@/lib/dragons";
import { toast } from "sonner";
import etcLogo from "@/assets/etc-logo.png";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { session, signInWithWallet, loading } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/farm" });
  }, [session, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEtcAddress(address)) {
      toast.error("Invalid ETC address. Must be 0x + 40 hex chars.");
      return;
    }
    setBusy(true);
    try {
      await signInWithWallet(address);
      toast.success("Wallet connected");
      navigate({ to: "/farm" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not connect wallet");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-grid">
      {/* Header */}
      <header className="px-6 py-5 flex items-center gap-3">
        <img src={etcLogo} alt="ETC" className="h-9 w-9 rounded-full object-cover drop-shadow-[0_0_12px_rgba(74,222,128,0.6)]" />
        <span className="font-display text-lg tracking-[0.35em] text-primary text-glow">DRACO ETC</span>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
              <img src={etcLogo} alt="ETC" className="relative h-20 w-20 rounded-full" />
            </div>
          </div>

          <h1 className="mt-6 font-display text-6xl md:text-7xl tracking-[0.2em] text-primary text-glow">
            DRACO FARM
          </h1>

          <p className="mt-5 text-base md:text-lg text-foreground/80 mx-auto max-w-xl">
            The premier dragon farming game on Ethereum Classic. Breed, fuse,
            and earn <span className="text-primary font-semibold">real ETC rewards</span>.
          </p>

          {/* Stats */}
          <div className="mt-8 flex justify-center gap-3 md:gap-4">
            {[
              { v: "15", l: "DRAGONS" },
              { v: "0.01 ETC", l: "POOL / 6H" },
              { v: "30", l: "MAX SLOTS" },
            ].map((s) => (
              <div
                key={s.l}
                className="px-5 py-3 rounded-md border border-primary/40 bg-background/40 backdrop-blur-sm min-w-[110px]"
              >
                <div className="font-display text-xl text-primary text-glow">{s.v}</div>
                <div className="text-[10px] tracking-[0.25em] text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Wallet card */}
          <form
            onSubmit={onSubmit}
            className="mt-8 mx-auto max-w-xl p-6 rounded-xl border border-primary/40 bg-background/60 backdrop-blur-md shadow-[var(--shadow-card)] text-left"
          >
            <div className="text-center text-xs tracking-[0.3em] text-muted-foreground mb-3">
              YOUR ETC WALLET ADDRESS
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-border bg-background/70">
              <span className="text-muted-foreground">💼</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x71C7656EC7ab88b098defB751B7401B5f6d8976F..."
                spellCheck={false}
                autoComplete="off"
                className="flex-1 bg-transparent outline-none font-mono text-sm placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">Rejected:</span>
              {["BTC", "LTC", "SOL", "TRX", "XRP"].map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded border border-destructive/50 text-destructive/90 font-mono"
                >
                  {c} ✕
                </span>
              ))}
              <span className="px-2 py-0.5 rounded border border-primary/60 text-primary font-mono">
                ETC ✓
              </span>
            </div>

            <button
              type="submit"
              disabled={busy || loading}
              className="mt-5 w-full py-3 rounded-md bg-primary text-primary-foreground font-display tracking-[0.3em] text-sm hover:brightness-110 shadow-[0_0_30px_rgba(74,222,128,0.35)] transition disabled:opacity-60"
            >
              {busy ? "CONNECTING…" : "CONNECT & ENTER FARM"}
            </button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              You'll be asked to sign in with Google, Apple, or email
            </p>
          </form>
        </div>
      </section>

      {/* Footer features */}
      <footer className="border-t border-primary/20 bg-background/60 backdrop-blur-md">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { i: "🐉", t: "15 Dragon Types", d: "5 rarities each" },
            { i: "🥚", t: "Egg Farming", d: "Manual collect system" },
            { i: "🔥", t: "Dragon Fusion", d: "Merge to upgrade" },
            { i: "💎", t: "ETC Rewards", d: "Every 6 hours" },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-3 px-5 py-4 border-r border-primary/10 last:border-r-0">
              <div className="text-primary text-xl">{f.i}</div>
              <div>
                <div className="text-sm font-semibold text-foreground">{f.t}</div>
                <div className="text-xs text-muted-foreground">{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
