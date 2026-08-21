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
        <h1 className="text-2xl font-semibold text-stone-900">Sections</h1>
        <p className="mt-1 text-sm text-stone-500">
          Top-level topics — Sutras, Slokas, Puranas, and whatever else you add. Open a section to
          manage its videos.
        </p>
      </div>

      <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {(sections ?? []).map((section) => (
          <li key={section.id} className="flex items-center justify-between gap-4 p-4">
            <Link href={`/sections/${section.id}`} className="flex-1">
              <p className="font-medium text-stone-900">{section.title}</p>
              {section.description && (
                <p className="text-sm text-stone-500">{section.description}</p>
              )}
            </Link>
            <form action={deleteSection.bind(null, section.id)}>
              <ConfirmSubmitButton
                confirmMessage={`Delete "${section.title}" and all its videos? This can't be undone.`}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </li>
        ))}
        {(sections ?? []).length === 0 && (
          <li className="p-4 text-sm text-stone-500">No sections yet — add one below.</li>
        )}
      </ul>

      <form action={createSection} className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Add a section</h2>
        <input
          name="title"
          placeholder="Title (e.g. Sutras)"
          required
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="description"
          placeholder="Description (optional)"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="display_order"
          type="number"
          defaultValue={0}
          placeholder="Display order"
          className="w-32 rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          Add section
        </button>
      </form>
    </div>
  );
}
