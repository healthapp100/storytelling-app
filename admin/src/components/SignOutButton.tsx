"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
      className="mt-4 rounded-lg border border-border px-3 py-2 text-left text-sm font-medium text-ink-muted transition-colors hover:border-danger hover:bg-danger-soft hover:text-danger"
    >
      Sign out
    </button>
  );
}
