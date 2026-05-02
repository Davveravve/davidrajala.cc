import Link from "next/link";
import { Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format-price";
import { StoreTabs } from "@/components/admin/store-tabs";

export const metadata = { title: "Orders — Admin" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      customer: { select: { email: true, name: true } },
      items: { include: { product: { select: { title: true } } } },
    },
  });

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

      <div className="mb-8">
        <p className="text-sm text-[var(--color-fg-muted)]">
          Most recent first. Up to 200 shown.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] mb-4">
            <Inbox size={22} />
          </div>
          <div className="font-display text-xl mb-1">No orders yet</div>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Orders will show up here once customers buy something.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--color-border)]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">#{o.id.slice(0, 8)}</span>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${statusClass(o.status)}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <Link
                    href={`/admin/customers#${o.customerId}`}
                    className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] truncate block"
                  >
                    {o.customer.name || o.customer.email}
                  </Link>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display text-base tabular-nums">
                    {formatPrice(o.totalAmount, o.currency)}
                  </div>
                  <div className="text-[11px] text-[var(--color-fg-dim)] mt-0.5 tabular-nums">
                    {new Date(o.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
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
