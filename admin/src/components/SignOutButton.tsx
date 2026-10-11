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
      className="mt-4 border-t border-border py-3 pl-4 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
    >
      Sign out
    </button>
  );
}
