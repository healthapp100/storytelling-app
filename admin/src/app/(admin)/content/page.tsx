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
        <h1 className="text-2xl font-semibold text-stone-900">Home content</h1>
        <p className="mt-1 text-sm text-stone-500">
          What every user sees on the home screen before anything else.
        </p>
      </div>

      <form
        action={updateIntroText}
        className="space-y-3 rounded-lg border border-stone-200 bg-white p-4"
      >
        <h2 className="text-sm font-semibold text-stone-900">Intro text</h2>
        <textarea
          name="home_intro_text"
          defaultValue={introText}
          rows={4}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          Save
        </button>
      </form>

      <IntroVideoUploadForm currentKey={introVideoKey} />
    </div>
  );
}
