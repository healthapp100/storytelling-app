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
      className="w-full max-w-sm space-y-8"
    >
      <div>
        <h1 className="font-display text-4xl leading-tight text-ink">Welcome back.</h1>
        <p className="mt-3 text-sm text-ink-muted">Administrators only. Sign in to manage stories, pricing and the home page.</p>
      </div>

      <div className="space-y-5">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border-0 border-b-[1.5px] border-rule bg-transparent px-0 py-3 text-base text-ink placeholder:text-ink-faint transition-colors focus:border-ink focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border-0 border-b-[1.5px] border-rule bg-transparent px-0 py-3 text-base text-ink placeholder:text-ink-faint transition-colors focus:border-ink focus:outline-none"
        />
      </div>

      {error && (
        <p className="border-l-[3px] border-danger pl-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-night py-3.5 font-display text-xl text-cream transition-all duration-150 hover:bg-night-raised active:scale-[0.99] disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
