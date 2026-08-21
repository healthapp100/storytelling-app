"use client";

import { useState } from "react";
import { uploadFileToR2 } from "../lib/r2-upload";
import { upsertAppContent } from "../app/(admin)/content/actions";

export function IntroVideoUploadForm({ currentKey }: { currentKey: string | null }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { storageKey } = await uploadFileToR2(file, setProgress);
      await upsertAppContent("home_intro_video_key", storageKey);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-stone-900">Static intro video</h2>
      <p className="text-xs text-stone-500">
        Shown on the home screen for every visitor, 24/7 — the 2–3 minute app introduction.
      </p>
      <p className="text-sm text-stone-700">
        Current file: <code>{currentKey ?? "none set"}</code>
      </p>
      <input type="file" accept="video/*" disabled={uploading} onChange={handleChange} className="text-sm" />
      {uploading && <p className="text-sm text-stone-500">Uploading… {progress}%</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
