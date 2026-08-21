import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";
import type { Section, Video } from "../../../../types/database";
import { VideoUploadForm } from "../../../../components/VideoUploadForm";
import { ConfirmSubmitButton } from "../../../../components/ConfirmSubmitButton";
import { expireVideoNow, setDailyFeatured } from "./actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const STATUS_STYLES: Record<Video["status"], string> = {
  scheduled: "bg-amber-100 text-amber-800",
  live: "bg-emerald-100 text-emerald-800",
  expired: "bg-stone-200 text-stone-600",
  deleted: "bg-stone-200 text-stone-500",
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
    return <p className="text-sm text-stone-500">Section not found.</p>;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/sections" className="text-sm text-stone-500 hover:underline">
          ← All sections
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900">{section.title}</h1>
        {section.description && <p className="text-sm text-stone-500">{section.description}</p>}
      </div>

      <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {(videos ?? []).map((video) => (
          <li key={video.id} className="flex items-start justify-between gap-4 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-stone-900">{video.title}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[video.status]}`}
                >
                  {video.status}
                </span>
                {video.is_daily_featured && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    Today&apos;s video
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Posted {formatDate(video.posted_at)} · Expires {formatDate(video.expires_at)}
                {video.access_tier === "one_time" &&
                  ` · $${((video.price_cents ?? 0) / 100).toFixed(2)}`}
              </p>
            </div>

            {video.status === "live" && (
              <div className="flex shrink-0 gap-3">
                {!video.is_daily_featured && (
                  <form action={setDailyFeatured.bind(null, id, video.id)}>
                    <button type="submit" className="text-sm text-indigo-600 hover:underline">
                      Feature
                    </button>
                  </form>
                )}
                <form action={expireVideoNow.bind(null, id, video.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`Remove "${video.title}" now? It will be purged on the next expiry sweep.`}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove now
                  </ConfirmSubmitButton>
                </form>
              </div>
            )}
          </li>
        ))}
        {(videos ?? []).length === 0 && (
          <li className="p-4 text-sm text-stone-500">No videos in this section yet.</li>
        )}
      </ul>

      <VideoUploadForm sectionId={id} />
    </div>
  );
}
