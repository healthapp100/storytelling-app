"use client";

import { useRef, useState } from "react";
import type { Video } from "../types/database";
import { updateVideo } from "../app/(admin)/sections/[id]/actions";
import { storagePublicUrl, uploadFileToStorage } from "../lib/storage-upload";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink transition-colors focus:border-accent focus:outline-none";

function toDateTimeLocal(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditVideoForm({ sectionId, video }: { sectionId: string; video: Video }) {
  const [open, setOpen] = useState(false);
  const [accessTier, setAccessTier] = useState<"subscription" | "one_time">(video.access_tier);
  const [saving, setSaving] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-ink-muted transition-colors hover:text-accent"
      >
        {open ? "Cancel" : "Edit"}
      </button>

      {open && (
        <form
          action={async (formData) => {
            setSaving(true);
            try {
              const thumbnailFile = thumbnailInputRef.current?.files?.[0];
              if (thumbnailFile) {
                const { storageKey } = await uploadFileToStorage(thumbnailFile, undefined, "images");
                formData.set("thumbnail_url", storagePublicUrl(storageKey));
              } else if (video.thumbnail_url) {
                formData.set("thumbnail_url", video.thumbnail_url);
              }
              await updateVideo(sectionId, video.id, formData);
              setOpen(false);
            } finally {
              setSaving(false);
            }
          }}
          className="mt-3 space-y-2 rounded-lg border border-border bg-paper p-3"
        >
          <input name="title" defaultValue={video.title} required className={inputClass} placeholder="Title" />
          <textarea
            name="description"
            defaultValue={video.description ?? ""}
            rows={2}
            className={inputClass}
            placeholder="Description"
          />
          <input
            name="duration_seconds"
            type="number"
            defaultValue={video.duration_seconds ?? ""}
            className={inputClass}
            placeholder="Duration in seconds"
          />
          <label className="block text-sm text-ink-muted">
            Thumbnail image (optional — leave blank to keep the current one)
            <input
              ref={thumbnailInputRef}
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
            <input
              name="price_rupees"
              type="number"
              defaultValue={video.price_rupees ?? ""}
              required
              className={inputClass}
              placeholder="Price in rupees, e.g. 199"
            />
          )}

          <label className="block text-sm text-ink-muted">
            Expiry date
            <input
              name="expires_at"
              type="datetime-local"
              defaultValue={toDateTimeLocal(video.expires_at)}
              required
              className={`mt-1 ${inputClass}`}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-ink disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}
