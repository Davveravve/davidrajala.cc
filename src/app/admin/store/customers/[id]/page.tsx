import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Mail,
  Calendar,
  ShoppingBag,
  Gift,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format-price";
import { GiftOrderButton } from "@/components/admin/gift-order-button";

export const metadata = { title: "Customer — Admin" };

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, products] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: { include: { product: true } } },
        },
      },
    }),
    prisma.storeProduct.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      select: { id: true, title: true, fileName: true },
    }),
  ]);
  if (!customer) notFound();

  const paidOrders = customer.orders.filter((o) => o.status === "paid");
  const lifetimeValue = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const currency = paidOrders[0]?.currency ?? "USD";

  // Flatten paid items as "things bought".
  const purchasedItems = paidOrders.flatMap((o) =>
    o.items.map((it) => ({ order: o, item: it })),
  );

  return (
    <div className="container-page max-w-4xl py-8 md:py-12">
      <Link
        href="/admin/store/customers"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Back to customers
      </Link>

      <header className="flex items-start justify-between gap-6 mb-10">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xl font-medium flex-shrink-0">
            {(customer.name || customer.email)[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-1">
              Customer
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight truncate">
              {customer.name || customer.email.split("@")[0]}
            </h1>
            <div className="mt-2 flex items-center gap-4 text-xs text-[var(--color-fg-muted)] flex-wrap">
              <a
                href={`mailto:${customer.email}`}
                className="inline-flex items-center gap-1.5 hover:text-[var(--color-accent)] transition-colors"
              >
                <Mail size={12} />
                {customer.email}
              </a>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} />
                Joined{" "}
                {new Date(customer.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
        <GiftButtonWrapper
          customerId={customer.id}
          customerLabel={customer.name || customer.email}
          products={products}
        />
      </header>

      <section className="grid grid-cols-3 gap-3 mb-10">
        <Stat label="Lifetime spend" value={formatPrice(lifetimeValue, currency)} />
        <Stat label="Paid orders" value={String(paidOrders.length)} />
        <Stat label="Total orders" value={String(customer.orders.length)} />
      </section>

      <section className="mb-12">
        <header className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-lg font-medium">Purchased</h2>
          <span className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
            {purchasedItems.length} item{purchasedItems.length === 1 ? "" : "s"}
          </span>
        </header>
        {purchasedItems.length === 0 ? (
          <Empty
            icon={<ShoppingBag size={20} />}
            text="No purchases yet."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {purchasedItems.map(({ order, item }) => (
              <li
                key={item.id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] flex-shrink-0">
                  {order.isGift ? <Gift size={14} /> : <ShoppingBag size={14} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate flex items-center gap-2">
                    {item.product?.title ?? "Product"}
                    {order.isGift && (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-accent)] border border-[var(--color-accent)]/40 px-1.5 py-0.5 rounded">
                        Gift
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {item.downloadCount > 0 && ` · ${item.downloadCount} downloads`}
                  </div>
                </div>
                <Link
                  href={`/admin/store/orders/${order.id}`}
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] flex-shrink-0"
                >
                  Order
                  <ArrowUpRight size={11} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <header className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-lg font-medium">All orders</h2>
          <span className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
            {customer.orders.length} total
          </span>
        </header>
        {customer.orders.length === 0 ? (
          <Empty
            icon={<ShoppingBag size={20} />}
            text="No orders yet."
          />
        ) : (
          <ul className="space-y-2">
            {customer.orders.map((o) => (
              <li
                key={o.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors"
              >
                <Link
                  href={`/admin/store/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm">
                        #{o.id.slice(0, 8)}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${statusClass(o.status)}`}
                      >
                        {o.status}
                      </span>
                      {o.isGift && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-accent)] border border-[var(--color-accent)]/40 px-1.5 py-0.5 rounded">
                          Gift
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-fg-muted)] truncate">
                      {o.items.map((it) => it.product?.title ?? "?").join(", ")}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm tabular-nums">
                      {formatPrice(o.totalAmount, o.currency)}
                    </div>
                    <div className="text-[11px] text-[var(--color-fg-dim)] mt-0.5 tabular-nums">
                      {new Date(o.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-1">
        {label}
      </div>
      <div className="font-display text-2xl font-medium tabular-nums">
        {value}
      </div>
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] mb-3">
        {icon}
      </div>
      <p className="text-sm text-[var(--color-fg-muted)]">{text}</p>
    </div>
  );
}

function GiftButtonWrapper({
  customerId,
  customerLabel,
  products,
}: {
  customerId: string;
  customerLabel: string;
  products: { id: string; title: string; fileName: string }[];
}) {
  return (
    <div className="flex-shrink-0">
      <GiftOrderButton
        customerId={customerId}
        customerLabel={customerLabel}
        products={products}
      />
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
