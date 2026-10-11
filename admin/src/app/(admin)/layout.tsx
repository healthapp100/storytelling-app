import { requireAdmin } from "../../lib/require-admin";
import { SignOutButton } from "../../components/SignOutButton";
import { NavLinks } from "../../components/NavLinks";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="flex w-64 shrink-0 flex-col border-r border-rule bg-paper-raised p-5">
        <div className="mb-6">
          <p className="font-display text-2xl leading-none text-ink">Storytelling</p>
          <p className="mt-2 truncate text-sm text-ink-muted">{profile.display_name ?? profile.email}</p>
        </div>
        <NavLinks />
        <SignOutButton />
      </aside>
      <main className="flex-1 p-8 lg:p-12">{children}</main>
    </div>
  );
}
