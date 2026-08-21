// Nightly sweep — see ARCHITECTURE.md §5.
// Finds videos past expires_at, deletes the R2 object, marks the row deleted.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { S3Client, DeleteObjectCommand } from "npm:@aws-sdk/client-s3@3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${Deno.env.get("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
    secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
  },
});

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
      await r2.send(
        new DeleteObjectCommand({
          Bucket: Deno.env.get("R2_BUCKET")!,
          Key: video.storage_key,
        })
      );
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
