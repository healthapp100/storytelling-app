import { createClient } from "../../../lib/supabase/server";
import type { AdminActivityLog, Profile } from "../../../types/database";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: log } = await supabase
    .from("admin_activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<AdminActivityLog[]>();

  const adminIds = [...new Set((log ?? []).map((row) => row.admin_id))];
  const { data: admins } = adminIds.length
    ? await supabase.from("profiles").select("*").in("id", adminIds).returns<Profile[]>()
    : { data: [] as Profile[] };
  const adminById = new Map((admins ?? []).map((admin) => [admin.id, admin]));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Audit trail</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Activity log</h1>
        <p className="mt-2 text-sm text-ink-muted">Last 200 admin actions, most recent first.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-paper-raised">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Table</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(log ?? []).map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-paper">
                <td className="px-4 py-3 text-ink-muted">{formatDate(row.created_at)}</td>
                <td className="px-4 py-3 text-ink">
                  {adminById.get(row.admin_id)?.display_name ??
                    adminById.get(row.admin_id)?.email ??
                    row.admin_id}
                </td>
                <td className="px-4 py-3 text-ink">{row.action}</td>
                <td className="px-4 py-3 text-ink-muted">{row.target_table}</td>
              </tr>
            ))}
            {(log ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-faint">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
