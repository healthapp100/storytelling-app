import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { configurePurchases, logOutPurchases } from "./purchases";
import { registerForDailyVideoNotifications } from "./notifications";
import type { Profile } from "../types/database";

type SessionContextValue = {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
};

const SessionContext = createContext<SessionContextValue>({
  session: null,
  profile: null,
  isAdmin: false,
  loading: true,
});

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wrapped in try/catch so a failure in any one step (e.g. RevenueCat
    // native config throwing on a misconfigured key) can't leave loading
    // stuck true forever and block the whole app behind a blank screen.
    supabase
      .auth.getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session) {
          configurePurchases(data.session.user.id);
          registerForDailyVideoNotifications(data.session.user.id);
          setProfile(await fetchProfile(data.session.user.id));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      try {
        if (event === "SIGNED_IN" && newSession) {
          configurePurchases(newSession.user.id);
          registerForDailyVideoNotifications(newSession.user.id);
          setProfile(await fetchProfile(newSession.user.id));
        }
        if (event === "SIGNED_OUT") {
          logOutPurchases();
          setProfile(null);
        }
      } catch {
        // Best-effort side effects (push token registration, RevenueCat
        // login) — a failure here shouldn't leave auth state changes unhandled.
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const isAdmin = profile?.role === "admin";

  return (
    <SessionContext.Provider value={{ session, profile, isAdmin, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
