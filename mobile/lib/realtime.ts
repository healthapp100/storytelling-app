import { useEffect } from "react";
import { supabase } from "./supabase";

// Subscribes to Postgres changes on one table and calls `onChange` whenever
// a row is inserted/updated/deleted — used to refetch a screen's data the
// moment an admin edit lands, instead of waiting for the next manual
// refresh. Requires the table to be added to the `supabase_realtime`
// publication (see supabase/migrations/0006_realtime.sql).
export function useRealtimeTable(table: string, onChange: () => void, filter?: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}:${filter ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter]);
}
