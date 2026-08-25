import { createClient } from "./supabase/client";

const BUCKET = "videos";

// Uploads straight to Supabase Storage using the signed-in admin's own
// session — the storage.objects RLS policies (0007_storage.sql) are what
// actually enforce "only admins can write here," not this code. No
// presigned-URL round trip needed, unlike the R2 setup this replaced.
export async function uploadFileToStorage(
  file: File,
  onProgress?: (percent: number) => void,
  folder: string = "videos"
): Promise<{ storageKey: string }> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Not signed in.");

  const storageKey = `${folder}/${Date.now()}-${file.name}`;
  const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}/${storageKey}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
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

export function storagePublicUrl(storageKey: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storageKey}`;
}
