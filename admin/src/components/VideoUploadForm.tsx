"use client";

import { useRef, useState } from "react";
import { storagePublicUrl, uploadFileToStorage } from "../lib/storage-upload";
import { createVideo } from "../app/(admin)/sections/[id]/actions";

type Stage = "idle" | "requesting-url" | "uploading" | "saving" | "done";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

export function VideoUploadForm({ sectionId }: { sectionId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [accessTier, setAccessTier] = useState<"subscription" | "one_time">("subscription");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("Choose a video file first.");
      return;
    }

    try {
      setStage("requesting-url");
      setStage("uploading");
      const { storageKey } = await uploadFileToStorage(file, setProgress);

      const formData = new FormData(form);

      const thumbnailInput = form.elements.namedItem("thumbnail") as HTMLInputElement;
      const thumbnailFile = thumbnailInput?.files?.[0];
      if (thumbnailFile) {
        const { storageKey: thumbnailKey } = await uploadFileToStorage(thumbnailFile, undefined, "images");
        formData.set("thumbnail_url", storagePublicUrl(thumbnailKey));
      }

      setStage("saving");
      formData.set("storage_key", storageKey);
      await createVideo(sectionId, formData);

      setStage("done");
      form.reset();
      setProgress(0);
      setStage("idle");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Upload failed.");
      setStage("idle");
    }
  };

  const busy = stage !== "idle" && stage !== "done";

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-border bg-paper-raised p-5"
    >
      <h2 className="font-display text-lg text-ink">Upload a video</h2>

      <input name="title" placeholder="Title" required className={inputClass} />
      <textarea name="description" placeholder="Description (optional)" rows={2} className={inputClass} />
      <input
        name="file"
        type="file"
        accept="video/*"
        required
        className="w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-ink"
      />
      <input
        name="duration_seconds"
        type="number"
        placeholder="Duration in seconds (optional)"
        className={inputClass}
      />
      <label className="block text-sm text-ink-muted">
        Thumbnail image (optional)
        <input
          name="thumbnail"
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-ink"
        />
      </label>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="radio"
            name="access_tier"
            value="subscription"
            checked={accessTier === "subscription"}
            onChange={() => setAccessTier("subscription")}
            className="accent-accent"
          />
          Subscription
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="radio"
            name="access_tier"
            value="one_time"
            checked={accessTier === "one_time"}
            onChange={() => setAccessTier("one_time")}
            className="accent-accent"
          />
          Pay per video
        </label>
      </div>
      {accessTier === "one_time" && (
        <input name="price_rupees" type="number" placeholder="Price in rupees, e.g. 199" required className={inputClass} />
      )}

      <label className="block text-sm text-ink-muted">
        Expiry date (mandatory — video is auto-deleted after this)
        <input name="expires_at" type="datetime-local" required className={`mt-1 ${inputClass}`} />
      </label>

      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input type="checkbox" name="is_daily_featured" className="accent-accent" />
        Feature as Today&apos;s Video (replaces the current one)
      </label>

      {error && (
        <p className="rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}
      {stage === "uploading" && (
        <div className="space-y-1">
          <p className="text-sm text-ink-muted">Uploading… {progress}%</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent-soft">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {stage === "requesting-url" && <p className="text-sm text-ink-muted">Preparing upload…</p>}
      {stage === "saving" && <p className="text-sm text-ink-muted">Saving video details…</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-ink disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Upload video"}
      </button>
    </form>
  );
}
