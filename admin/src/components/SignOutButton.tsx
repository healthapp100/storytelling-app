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
      className="mt-4 rounded-md px-3 py-2 text-left text-sm text-stone-500 hover:bg-stone-100"
    >
      Sign out
    </button>
  );
}
