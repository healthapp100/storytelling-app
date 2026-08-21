import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import type { Section } from "../../../types/database";
import { createSection, deleteSection } from "./actions";
import { ConfirmSubmitButton } from "../../../components/ConfirmSubmitButton";

export default async function SectionsPage() {
  const supabase = await createClient();
  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .order("display_order")
    .returns<Section[]>();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Content</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Sections</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Top-level topics — Sutras, Slokas, Puranas, and whatever else you add. Open a section to
          manage its videos.
        </p>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-paper-raised">
        {(sections ?? []).map((section) => (
          <li
            key={section.id}
            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-paper"
          >
            <Link href={`/sections/${section.id}`} className="flex-1">
              <p className="font-medium text-ink">{section.title}</p>
              {section.description && (
                <p className="text-sm text-ink-muted">{section.description}</p>
              )}
            </Link>
            <form action={deleteSection.bind(null, section.id)}>
              <ConfirmSubmitButton
                confirmMessage={`Delete "${section.title}" and all its videos? This can't be undone.`}
                className="text-sm font-medium text-danger transition-colors hover:text-accent-ink hover:underline"
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </li>
        ))}
        {(sections ?? []).length === 0 && (
          <li className="p-4 text-sm text-ink-faint">No sections yet — add one below.</li>
        )}
      </ul>

      <form
        action={createSection}
        className="space-y-3 rounded-xl border border-border bg-paper-raised p-5"
      >
        <h2 className="font-display text-lg text-ink">Add a section</h2>
        <input
          name="title"
          placeholder="Title (e.g. Sutras)"
          required
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none"
        />
        <input
          name="description"
          placeholder="Description (optional)"
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none"
        />
        <input
          name="display_order"
          type="number"
          defaultValue={0}
          placeholder="Display order"
          className="w-36 rounded-lg border border-border px-3 py-2.5 text-sm text-ink transition-colors focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-ink"
        >
          Add section
        </button>
      </form>
    </div>
  );
}
