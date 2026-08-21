"use client";

import { useState } from "react";
import type { Section } from "../types/database";
import { updateSection } from "../app/(admin)/sections/actions";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink transition-colors focus:border-accent focus:outline-none";

export function EditSectionForm({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);

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
            await updateSection(section.id, formData);
            setOpen(false);
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
          <button
            type="submit"
            className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-ink"
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
}
