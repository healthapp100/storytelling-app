"use client";

import { useState } from "react";
import { uploadFileToStorage } from "../lib/storage-upload";
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
      const { storageKey } = await uploadFileToStorage(file, setProgress);
      await upsertAppContent("home_intro_video_key", storageKey);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-paper-raised p-5">
      <div>
        <h2 className="font-display text-lg text-ink">Static intro video</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Shown on the home screen for every visitor, 24/7 — the 2–3 minute app introduction.
        </p>
      </div>
      <p className="text-sm text-ink-muted">
        Current file:{" "}
        <code className="rounded bg-accent-soft px-1.5 py-0.5 text-accent-ink">
          {currentKey ?? "none set"}
        </code>
      </p>
      <input
        type="file"
        accept="video/*"
        disabled={uploading}
        onChange={handleChange}
        className="text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-ink"
      />
      {uploading && (
        <div className="space-y-1">
          <p className="text-sm text-ink-muted">Uploading… {progress}%</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent-soft">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {error && (
        <p className="rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
