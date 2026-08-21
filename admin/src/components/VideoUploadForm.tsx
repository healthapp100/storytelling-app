"use client";

import { useRef, useState } from "react";
import { uploadFileToR2 } from "../lib/r2-upload";
import { createVideo } from "../app/(admin)/sections/[id]/actions";

type Stage = "idle" | "requesting-url" | "uploading" | "saving" | "done";

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
      const { storageKey } = await uploadFileToR2(file, setProgress);

      setStage("saving");
      const formData = new FormData(form);
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
      className="space-y-3 rounded-lg border border-stone-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-stone-900">Upload a video</h2>

      <input
        name="title"
        placeholder="Title"
        required
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
      <textarea
        name="description"
        placeholder="Description (optional)"
        rows={2}
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
      <input name="file" type="file" accept="video/*" required className="w-full text-sm" />
      <input
        name="duration_seconds"
        type="number"
        placeholder="Duration in seconds (optional)"
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
      />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="radio"
            name="access_tier"
            value="subscription"
            checked={accessTier === "subscription"}
            onChange={() => setAccessTier("subscription")}
          />
          Subscription
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="radio"
            name="access_tier"
            value="one_time"
            checked={accessTier === "one_time"}
            onChange={() => setAccessTier("one_time")}
          />
          Pay per video
        </label>
      </div>
      {accessTier === "one_time" && (
        <input
          name="price_cents"
          type="number"
          placeholder="Price in cents"
          required
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      )}

      <label className="block text-sm text-stone-700">
        Expiry date (mandatory — video is auto-deleted after this)
        <input
          name="expires_at"
          type="datetime-local"
          required
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" name="is_daily_featured" />
        Feature as Today&apos;s Video (replaces the current one)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {stage === "uploading" && (
        <p className="text-sm text-stone-500">Uploading… {progress}%</p>
      )}
      {stage === "requesting-url" && <p className="text-sm text-stone-500">Preparing upload…</p>}
      {stage === "saving" && <p className="text-sm text-stone-500">Saving video details…</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Upload video"}
      </button>
    </form>
  );
}
