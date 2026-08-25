import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import type { Section } from "../../../types/database";
import { deleteSection } from "./actions";
import { ConfirmSubmitButton } from "../../../components/ConfirmSubmitButton";
import { CreateSectionForm } from "../../../components/CreateSectionForm";
import { EditSectionForm } from "../../../components/EditSectionForm";

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
          <li key={section.id} className="p-4 transition-colors hover:bg-paper">
            <div className="flex items-center justify-between gap-4">
              <Link href={`/sections/${section.id}`} className="flex flex-1 items-center gap-3">
                {section.icon_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={section.icon_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium text-ink">{section.title}</p>
                  {section.description && (
                    <p className="text-sm text-ink-muted">{section.description}</p>
                  )}
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-4">
                <EditSectionForm section={section} />
                <form action={deleteSection.bind(null, section.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`Delete "${section.title}" and all its videos? This can't be undone.`}
                    className="text-sm font-medium text-danger transition-colors hover:text-accent-ink hover:underline"
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          </li>
        ))}
        {(sections ?? []).length === 0 && (
          <li className="p-4 text-sm text-ink-faint">No sections yet — add one below.</li>
        )}
      </ul>

      <CreateSectionForm />
    </div>
  );
}
