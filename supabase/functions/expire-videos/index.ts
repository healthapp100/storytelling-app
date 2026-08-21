// Nightly sweep — see ARCHITECTURE.md §5.
// Finds videos past expires_at, deletes the file from Supabase Storage,
// marks the row deleted.
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const { data: expired, error } = await supabase
    .from("videos")
    .select("id, storage_key")
    .in("status", ["live", "scheduled"])
    .lt("expires_at", new Date().toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results = [];
  for (const video of expired ?? []) {
    try {
      const { error: removeError } = await supabase.storage.from("videos").remove([video.storage_key]);
      if (removeError) throw removeError;

      await supabase.from("videos").update({ status: "deleted" }).eq("id", video.id);
      results.push({ id: video.id, deleted: true });
    } catch (deleteError) {
      results.push({ id: video.id, deleted: false, error: String(deleteError) });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
