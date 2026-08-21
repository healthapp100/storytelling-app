// The new File/Directory API (expo-file-system's default export as of
// SDK 54+) has no direct multipart/binary upload helper yet — uploadAsync
// still only exists under the legacy import path.
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "./supabase";

const BUCKET = "videos";

// Uploads straight to Supabase Storage using the signed-in admin's own
// session — storage.objects RLS policies (0007_storage.sql) are what
// actually enforce "only admins can write here." No presigned-URL round
// trip needed, unlike the R2 setup this replaced.
export async function uploadLocalFileToStorage(
  localUri: string,
  fileName: string,
  contentType: string
): Promise<{ storageKey: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Not signed in.");

  const storageKey = `videos/${Date.now()}-${fileName}`;
  const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}/${storageKey}`;

  const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: "POST",
    headers: {
      "Content-Type": contentType,
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload to storage failed (${result.status}).`);
  }

  return { storageKey };
}
