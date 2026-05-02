import Link from "next/link";
import { Inbox, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format-price";
import { StoreTabs } from "@/components/admin/store-tabs";

export const metadata = { title: "Orders — Admin" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "failed", label: "Failed" },
  { key: "refunded", label: "Refunded" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function isFilter(v: string | undefined): v is FilterKey {
  return !!v && FILTERS.some((f) => f.key === v);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const filter: FilterKey = isFilter(sp.status) ? sp.status : "all";

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: filter === "all" ? {} : { status: filter },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        customer: { select: { email: true, name: true } },
        items: { include: { product: { select: { title: true } } } },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countByStatus = new Map(
    counts.map((c) => [c.status, c._count._all]),
  );
  const totalCount = counts.reduce((n, c) => n + c._count._all, 0);

  return (
    <div className="container-page max-w-7xl py-8 md:py-12">
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Sales
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Store
        </h1>
      </div>

      <StoreTabs />

      <nav className="flex flex-wrap items-center gap-1 mb-6 border-b border-[var(--color-border)]">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          const count = f.key === "all" ? totalCount : (countByStatus.get(f.key) ?? 0);
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/admin/store/orders" : `/admin/store/orders?status=${f.key}`}
              aria-current={active ? "page" : undefined}
              className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                active
                  ? "text-[var(--color-fg)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              {f.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                  active
                    ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                    : "bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]"
                }`}
              >
                {count}
              </span>
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] mb-4">
            <Inbox size={22} />
          </div>
          <div className="font-display text-xl mb-1">
            {filter === "all" ? "No orders yet" : `No ${filter} orders`}
          </div>
          <p className="text-sm text-[var(--color-fg-muted)]">
            {filter === "all"
              ? "Orders will show up here once customers buy something."
              : "Switch tabs above to see other statuses."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors"
            >
              <Link
                href={`/admin/store/orders/${o.id}`}
                className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--color-border)]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">#{o.id.slice(0, 8)}</span>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${statusClass(o.status)}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-fg-muted)] truncate block">
                    {o.customer.name || o.customer.email}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display text-base tabular-nums">
                    {formatPrice(o.totalAmount, o.currency)}
                  </div>
                  <div className="text-[11px] text-[var(--color-fg-dim)] mt-0.5 tabular-nums inline-flex items-center gap-1">
                    {new Date(o.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <ArrowUpRight size={11} />
                  </div>
                </div>
              </Link>
              <ul className="px-5 py-3 divide-y divide-[var(--color-border)]">
                {o.items.map((it) => (
                  <li
                    key={it.id}
                    className="py-2 text-sm flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{it.product?.title ?? "Product"}</span>
                    <span className="text-[var(--color-fg-muted)] tabular-nums">
                      {formatPrice(it.priceAtPurchase, o.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function statusClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-[var(--color-accent)]/10 text-[var(--color-accent)]";
    case "pending":
      return "bg-orange-500/10 text-orange-300";
    case "failed":
      return "bg-red-500/10 text-red-400";
    case "refunded":
      return "bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]";
    default:
      return "bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]";
  }
}
