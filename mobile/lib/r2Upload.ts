import * as FileSystem from "expo-file-system";
import { supabase } from "./supabase";

export async function uploadLocalFileToR2(
  localUri: string,
  fileName: string,
  contentType: string
): Promise<{ storageKey: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Not signed in.");

  const functionsUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/r2-upload-url`;
  const urlResponse = await fetch(functionsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ fileName, contentType }),
  });
  if (!urlResponse.ok) {
    throw new Error(
      `Could not get an upload URL (${urlResponse.status}). Is the r2-upload-url function deployed?`
    );
  }
  const { uploadUrl, storageKey } = await urlResponse.json();

  const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: "PUT",
    headers: { "Content-Type": contentType },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload to storage failed (${result.status}).`);
  }

  return { storageKey };
}
