"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "not-admin"
      ? "That account isn't an admin. Ask an existing admin to promote it, or sign in with an admin account."
      : null
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/sections");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-xl border border-stone-200 bg-white p-8 shadow-sm"
    >
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-stone-500">
          Use an account already promoted to <code>admin</code> in Supabase.
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-stone-900 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
