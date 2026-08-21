// Issues a short-lived presigned PUT URL so the admin panel can upload a
// video file directly to R2 (bypassing Supabase as a relay). Caller must be
// an authenticated admin. See ARCHITECTURE.md §5.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3";

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

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  const { data: userData, error: userError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (userError || !userData.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { fileName, contentType } = await req.json();
  if (!fileName || !contentType) {
    return new Response("fileName and contentType are required", { status: 400 });
  }

  const storageKey = `videos/${Date.now()}-${fileName}`;
  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: Deno.env.get("R2_BUCKET")!,
      Key: storageKey,
      ContentType: contentType,
    }),
    { expiresIn: 60 * 10 } // 10 minutes
  );

  return new Response(JSON.stringify({ uploadUrl, storageKey }), {
    headers: { "Content-Type": "application/json" },
  });
});
