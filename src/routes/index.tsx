import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEtcAddress } from "@/lib/dragons";
import { toast } from "sonner";

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
      toast.error("Dirección ETC inválida. Debe ser 0x + 40 caracteres hex.");
      return;
    }
    setBusy(true);
    try {
      await signInWithWallet(address);
      toast.success("Wallet conectada");
      navigate({ to: "/farm" });
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo conectar la wallet");
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    // generate a deterministic demo address
    const hex = Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    setAddress("0x" + hex);
  };

  return (
    <main className="min-h-screen bg-grid">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-30 bg-background/70">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <LtcDiamond />
            <span className="font-display text-lg tracking-widest text-glow">DRACOS · ETC</span>
          </div>
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Cómo funciona</a>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-28 flex justify-center">
        <div className="max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Powered by Ethereum Classic
          </span>
          <h1 className="mt-5 text-5xl md:text-7xl font-display leading-[1.05] text-glow">
            Cría dragones.<br/>
            Gana <span className="text-primary">ETC</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground mx-auto max-w-lg">
            Dracos es un farm on-chain estilo idle. Coloca nidos, incuba huevos,
            fusiona dragones legendarios y reclama tu parte de cada{" "}
            <span className="text-primary font-semibold">pool de 0.01 ETC cada 6h</span>.
          </p>

          <form onSubmit={onSubmit} className="mt-10 p-5 rounded-xl border border-border bg-card/70 backdrop-blur shadow-[var(--shadow-card)] mx-auto max-w-lg text-left">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Conecta tu wallet ETC
            </label>
            <div className="flex gap-2">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x1234…abcd"
                className="font-mono"
                spellCheck={false}
                autoComplete="off"
              />
              <Button type="submit" disabled={busy || loading} className="btn-hero whitespace-nowrap">
                {busy ? "Conectando…" : "Entrar"}
              </Button>
            </div>
            <button type="button" onClick={fillDemo} className="mt-3 text-xs text-muted-foreground hover:text-primary underline">
              Usar dirección demo aleatoria
            </button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground mx-auto max-w-lg">
            🔒 La wallet se usa como identidad. Tu dirección es tu cuenta.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-display text-center text-glow">Cómo funciona</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {FEATURES.map((f) => (
            <div key={f.t} className="p-6 rounded-xl border border-border bg-card/60 backdrop-blur">
              <div className="text-primary font-display text-2xl">{f.n}</div>
              <h3 className="mt-2 font-semibold text-lg">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 mt-16">
        <div className="container mx-auto px-4 py-6 text-xs text-muted-foreground flex justify-between">
          <span>© Dracos · Ethereum Classic Farm</span>
          <span className="font-mono">v1.0</span>
        </div>
      </footer>
    </main>
  );
}

const FEATURES = [
  { n: "01", t: "Conecta wallet ETC", d: "Inicia sesión con tu dirección Ethereum Classic. Al entrar recibes 1 nido común y 1 huevo." },
  { n: "02", t: "Mapa de 30 slots", d: "Empiezas con 2 slots. Desbloquea más con Draco Points para escalar tu farm." },
  { n: "03", t: "Cría y fusiona", d: "15 dragones únicos × 5 rarezas. 2 dragones iguales = 1 de mejor rareza." },
  { n: "04", t: "Pools cada 6h", d: "Cada 6h se reparten 0.01 ETC entre los farmers, proporcional a sus Draco Points." },
  { n: "05", t: "Huevos y rarezas", d: "Nido legendario produce 60 huevos por dragón. Rareza del huevo = rareza del dragón." },
  { n: "06", t: "Reclama y repite", d: "Cuando un dragón pone huevos, reclámalo y vuelve a colocarlo. Idle a tu ritmo." },
];

function LtcDiamond() {
  return (
    <div className="relative w-9 h-9 rotate-45 rounded-md bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
      <div className="absolute inset-1 rounded-sm bg-background flex items-center justify-center -rotate-45">
        <span className="font-display text-primary text-sm">D</span>
      </div>
    </div>
  );
}
