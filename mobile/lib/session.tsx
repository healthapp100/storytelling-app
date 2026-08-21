import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { configurePurchases, logOutPurchases } from "./purchases";
import { registerForDailyVideoNotifications } from "./notifications";

type SessionContextValue = {
  session: Session | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextValue>({ session: null, loading: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        configurePurchases(data.session.user.id);
        registerForDailyVideoNotifications(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "SIGNED_IN" && newSession) {
        configurePurchases(newSession.user.id);
        registerForDailyVideoNotifications(newSession.user.id);
      }
      if (event === "SIGNED_OUT") logOutPurchases();
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
