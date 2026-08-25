"use client";

import { useRef, useState } from "react";
import { createSection } from "../app/(admin)/sections/actions";
import { storagePublicUrl, uploadFileToStorage } from "../lib/storage-upload";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

export function CreateSectionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setSaving(true);
        try {
          const formData = new FormData(event.currentTarget);
          const iconFile = iconInputRef.current?.files?.[0];
          if (iconFile) {
            const { storageKey } = await uploadFileToStorage(iconFile, undefined, "images");
            formData.set("icon_url", storagePublicUrl(storageKey));
          }
          await createSection(formData);
          formRef.current?.reset();
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : "Couldn't create section.");
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-3 rounded-xl border border-border bg-paper-raised p-5"
    >
      <h2 className="font-display text-lg text-ink">Add a section</h2>
      <input name="title" placeholder="Title (e.g. Sutras)" required className={inputClass} />
      <input name="description" placeholder="Description (optional)" className={inputClass} />
      <input
        name="display_order"
        type="number"
        defaultValue={0}
        placeholder="Display order"
        className={`${inputClass} w-36`}
      />
      <label className="block text-sm text-ink-muted">
        Icon image (optional)
        <input
          ref={iconInputRef}
          name="icon"
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-ink"
        />
      </label>
      {error && (
        <p className="rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-ink disabled:opacity-60"
      >
        {saving ? "Adding…" : "Add section"}
      </button>
    </form>
  );
}
