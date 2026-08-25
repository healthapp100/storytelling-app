"use client";

import { useRef, useState } from "react";
import type { Section } from "../types/database";
import { updateSection } from "../app/(admin)/sections/actions";
import { storagePublicUrl, uploadFileToStorage } from "../lib/storage-upload";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink transition-colors focus:border-accent focus:outline-none";

export function EditSectionForm({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

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
              const iconFile = iconInputRef.current?.files?.[0];
              if (iconFile) {
                const { storageKey } = await uploadFileToStorage(iconFile, undefined, "images");
                formData.set("icon_url", storagePublicUrl(storageKey));
              } else if (section.icon_url) {
                formData.set("icon_url", section.icon_url);
              }
              await updateSection(section.id, formData);
              setOpen(false);
            } finally {
              setSaving(false);
            }
          }}
          className="mt-3 space-y-2 rounded-lg border border-border bg-paper p-3"
        >
          <input
            name="title"
            defaultValue={section.title}
            required
            className={inputClass}
            placeholder="Title"
          />
          <input
            name="description"
            defaultValue={section.description ?? ""}
            className={inputClass}
            placeholder="Description"
          />
          <input
            name="display_order"
            type="number"
            defaultValue={section.display_order}
            className={`${inputClass} w-32`}
          />
          <label className="block text-sm text-ink-muted">
            Icon image (optional — leave blank to keep the current one)
            <input
              ref={iconInputRef}
              name="icon"
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-ink"
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
