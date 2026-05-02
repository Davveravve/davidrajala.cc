"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Receipt, Users } from "lucide-react";

const TABS = [
  { href: "/admin/store", label: "Products", icon: Package, exact: true },
  { href: "/admin/store/orders", label: "Orders", icon: Receipt },
  { href: "/admin/store/customers", label: "Customers", icon: Users },
];

export function StoreTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 mb-8 border-b border-[var(--color-border)]">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = t.exact
          ? pathname === t.href
          : pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              active
                ? "text-[var(--color-fg)]"
                : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            }`}
          >
            <Icon size={14} />
            {t.label}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
