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
        <h1 className="text-2xl font-semibold text-stone-900">Activity log</h1>
        <p className="mt-1 text-sm text-stone-500">Last 200 admin actions, most recent first.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Admin</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Table</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {(log ?? []).map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-stone-500">{formatDate(row.created_at)}</td>
                <td className="px-4 py-2">
                  {adminById.get(row.admin_id)?.display_name ??
                    adminById.get(row.admin_id)?.email ??
                    row.admin_id}
                </td>
                <td className="px-4 py-2">{row.action}</td>
                <td className="px-4 py-2 text-stone-500">{row.target_table}</td>
              </tr>
            ))}
            {(log ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-stone-500">
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
