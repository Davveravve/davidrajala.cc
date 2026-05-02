import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format-price";
import { StoreTabs } from "@/components/admin/store-tabs";
import { GiftOrderButton } from "@/components/admin/gift-order-button";

export const metadata = { title: "Customers — Admin" };

export default async function AdminCustomersPage() {
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          where: { status: "paid" },
          select: { totalAmount: true, currency: true },
        },
        _count: { select: { orders: true } },
      },
    }),
    prisma.storeProduct.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      select: { id: true, title: true, fileName: true },
    }),
  ]);

  return (
    <div className="container-page max-w-7xl py-8 md:py-12">
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          People
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Store
        </h1>
      </div>

      <StoreTabs />

      <div className="mb-8">
        <p className="text-sm text-[var(--color-fg-muted)]">
          Everyone with a store account.
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] mb-4">
            <Users size={22} />
          </div>
          <div className="font-display text-xl mb-1">No customers yet</div>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Customers appear here after they sign up or make a purchase.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          {customers.map((c) => {
            const lifetimeValue = c.orders.reduce(
              (sum, o) => sum + o.totalAmount,
              0,
            );
            const currency = c.orders[0]?.currency ?? "SEK";
            return (
              <li
                key={c.id}
                id={c.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-surface-2)]/40 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-sm font-medium flex-shrink-0">
                  {(c.name || c.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {c.name || c.email.split("@")[0]}
                  </div>
                  <div className="text-xs text-[var(--color-fg-muted)] truncate">
                    {c.email}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 text-sm">
                  <div className="tabular-nums">
                    {formatPrice(lifetimeValue, currency)}
                  </div>
                  <div className="text-[11px] text-[var(--color-fg-dim)] tabular-nums">
                    {c._count.orders} {c._count.orders === 1 ? "order" : "orders"}
                  </div>
                </div>
                <time className="text-[11px] text-[var(--color-fg-dim)] tabular-nums flex-shrink-0">
                  {new Date(c.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </time>
                <GiftOrderButton
                  customerId={c.id}
                  customerLabel={c.name || c.email}
                  products={products}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
