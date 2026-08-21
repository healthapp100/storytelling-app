// Fans out "today's video is up" pushes via Expo's push API. Triggered by
// the on_daily_video_featured DB trigger (see migration 0005). See
// mobile/lib/notifications.ts for how tokens get registered.
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100; // Expo's push API accepts at most 100 messages per request.

Deno.serve(async (req) => {
  const { videoId, title } = await req.json();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("push_token")
    .not("push_token", "is", null);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const tokens = (profiles ?? []).map((p) => p.push_token as string);
  const messages = tokens.map((token) => ({
    to: token,
    title: "Today's video is up",
    body: title ?? "A new story is waiting for you.",
    data: { videoId },
  }));

  let sent = 0;
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(batch),
    });
    if (response.ok) sent += batch.length;
  }

  return new Response(JSON.stringify({ recipients: tokens.length, sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
