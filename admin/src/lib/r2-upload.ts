import { createClient } from "./supabase/client";

export async function uploadFileToR2(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ storageKey: string }> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Not signed in.");

  const functionsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/r2-upload-url`;
  const urlResponse = await fetch(functionsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ fileName: file.name, contentType: file.type }),
  });
  if (!urlResponse.ok) {
    throw new Error(
      `Could not get an upload URL (${urlResponse.status}). Is the r2-upload-url function deployed?`
    );
  }
  const { uploadUrl, storageKey } = await urlResponse.json();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload to storage failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Upload to storage failed."));
    xhr.send(file);
  });

  return { storageKey };
}
