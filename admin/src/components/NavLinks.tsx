"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/sections", label: "Sections & Videos" },
  { href: "/pricing", label: "Pricing" },
  { href: "/content", label: "Home content" },
  { href: "/activity", label: "Activity log" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col border-t border-border">
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group relative py-2.5 pl-4 pr-3 font-display text-lg transition-colors ${
              active ? "text-ink" : "text-ink-faint hover:bg-accent-soft/60 hover:text-ink"
            }`}
          >
            <span
              aria-hidden
              className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 bg-accent transition-all duration-200 ${
                active ? "h-6" : "h-0 group-hover:h-3"
              }`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
