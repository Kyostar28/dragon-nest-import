import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  session: Session | null;
  loading: boolean;
  signInWithWallet: (address: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

// Deterministic email/password from ETC wallet address (simulated wallet auth)
function credsFor(address: string) {
  const a = address.trim().toLowerCase();
  return {
    email: `${a}@dracos.etc`,
    // Static suffix; predictable but unique per address (demo wallet flow).
    password: `dracos!${a}!ETC`,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithWallet = async (address: string) => {
    const { email, password } = credsFor(address);
    // Try sign in first
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error) {
      // Try sign up if doesn't exist
      const signUp = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { wallet_address: address.trim().toLowerCase() },
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (signUp.error) throw signUp.error;
      // Auto-confirm is on, so session is created
      if (!signUp.data.session) {
        // Fallback: try sign in after signup
        const after = await supabase.auth.signInWithPassword({ email, password });
        if (after.error) throw after.error;
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ session, loading, signInWithWallet, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
