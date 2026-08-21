import Link from "next/link";
import { requireAdmin } from "../../lib/require-admin";
import { SignOutButton } from "../../components/SignOutButton";

const NAV_ITEMS = [
  { href: "/sections", label: "Sections & Videos" },
  { href: "/pricing", label: "Pricing" },
  { href: "/content", label: "Home content" },
  { href: "/activity", label: "Activity log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-stone-200 bg-white p-4">
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold text-stone-900">Storytelling Admin</p>
          <p className="truncate text-xs text-stone-500">{profile.display_name ?? profile.email}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <SignOutButton />
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
