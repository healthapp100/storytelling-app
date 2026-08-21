import { requireAdmin } from "../../lib/require-admin";
import { SignOutButton } from "../../components/SignOutButton";
import { NavLinks } from "../../components/NavLinks";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-paper-raised p-4">
        <div className="mb-6 px-2">
          <p className="font-display text-lg text-ink">Storytelling Admin</p>
          <p className="truncate text-xs text-ink-muted">{profile.display_name ?? profile.email}</p>
        </div>
        <NavLinks />
        <SignOutButton />
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
