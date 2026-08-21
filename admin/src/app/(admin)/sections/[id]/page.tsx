import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";
import type { Section, Video } from "../../../../types/database";
import { VideoUploadForm } from "../../../../components/VideoUploadForm";
import { EditVideoForm } from "../../../../components/EditVideoForm";
import { ConfirmSubmitButton } from "../../../../components/ConfirmSubmitButton";
import { expireVideoNow, setDailyFeatured } from "./actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// Status colors are semantic (state at a glance), kept separate from the
// brand accent so they don't compete with it.
const STATUS_STYLES: Record<Video["status"], string> = {
  scheduled: "bg-amber-100 text-amber-800",
  live: "bg-success-soft text-success",
  expired: "bg-ink-faint/15 text-ink-muted",
  deleted: "bg-ink-faint/15 text-ink-faint",
};

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: section }, { data: videos }] = await Promise.all([
    supabase.from("sections").select("*").eq("id", id).maybeSingle<Section>(),
    supabase
      .from("videos")
      .select("*")
      .eq("section_id", id)
      .order("posted_at", { ascending: false })
      .returns<Video[]>(),
  ]);

  if (!section) {
    return <p className="text-sm text-ink-muted">Section not found.</p>;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/sections" className="text-sm text-ink-muted transition-colors hover:text-accent">
          ← All sections
        </Link>
        <h1 className="mt-1 font-display text-3xl text-ink">{section.title}</h1>
        {section.description && <p className="text-sm text-ink-muted">{section.description}</p>}
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-paper-raised">
        {(videos ?? []).map((video) => (
          <li key={video.id} className="p-4 transition-colors hover:bg-paper">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{video.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[video.status]}`}
                  >
                    {video.status}
                  </span>
                  {video.is_daily_featured && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
                      Today&apos;s video
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted">
                  Posted {formatDate(video.posted_at)} · Expires {formatDate(video.expires_at)}
                  {video.access_tier === "one_time" &&
                    ` · $${((video.price_cents ?? 0) / 100).toFixed(2)}`}
                </p>
              </div>

              {video.status === "live" && (
                <div className="flex shrink-0 items-center gap-3">
                  <EditVideoForm sectionId={id} video={video} />
                  {!video.is_daily_featured && (
                    <form action={setDailyFeatured.bind(null, id, video.id)}>
                      <button
                        type="submit"
                        className="text-sm font-medium text-accent transition-colors hover:text-accent-ink hover:underline"
                      >
                        Feature
                      </button>
                    </form>
                  )}
                  <form action={expireVideoNow.bind(null, id, video.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`Remove "${video.title}" now? It will be purged on the next expiry sweep.`}
                      className="text-sm font-medium text-danger transition-colors hover:underline"
                    >
                      Remove now
                    </ConfirmSubmitButton>
                  </form>
                </div>
              )}
            </div>
          </li>
        ))}
        {(videos ?? []).length === 0 && (
          <li className="p-4 text-sm text-ink-faint">No videos in this section yet.</li>
        )}
      </ul>

      <VideoUploadForm sectionId={id} />
    </div>
  );
}
