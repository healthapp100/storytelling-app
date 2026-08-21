import { createClient } from "../../../lib/supabase/server";
import type { AppContent } from "../../../types/database";
import { updateIntroText } from "./actions";
import { IntroVideoUploadForm } from "../../../components/IntroVideoUploadForm";

export default async function ContentPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("app_content")
    .select("*")
    .returns<AppContent[]>();

  const introText = (rows?.find((r) => r.key === "home_intro_text")?.value as string) ?? "";
  const introVideoKey =
    (rows?.find((r) => r.key === "home_intro_video_key")?.value as string) ?? null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Home screen</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Home content</h1>
        <p className="mt-2 text-sm text-ink-muted">
          What every user sees on the home screen before anything else.
        </p>
      </div>

      <form
        action={updateIntroText}
        className="space-y-3 rounded-xl border border-border bg-paper-raised p-5"
      >
        <h2 className="font-display text-lg text-ink">Intro text</h2>
        <textarea
          name="home_intro_text"
          defaultValue={introText}
          rows={4}
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink transition-colors focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-ink"
        >
          Save
        </button>
      </form>

      <IntroVideoUploadForm currentKey={introVideoKey} />
    </div>
  );
}
