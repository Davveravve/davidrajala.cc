import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format-price";
import { OrderActions } from "@/components/admin/order-actions";

export const metadata = { title: "Order — Admin" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });
  if (!order) notFound();

  return (
    <div className="container-page max-w-4xl py-8 md:py-12">
      <Link
        href="/admin/store/orders"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Back to orders
      </Link>

      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Order
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          #{order.id.slice(0, 8)}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          {new Date(order.createdAt).toLocaleString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <header className="px-5 py-4 border-b border-[var(--color-border)] flex items-baseline justify-between">
            <h2 className="font-medium">Items</h2>
            <span className="font-display text-lg tabular-nums">
              {formatPrice(order.totalAmount, order.currency)}
            </span>
          </header>
          <ul className="divide-y divide-[var(--color-border)]">
            {order.items.map((it) => (
              <li
                key={it.id}
                className="px-5 py-4 flex items-center gap-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] flex-shrink-0">
                  <Package size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {it.product?.title ?? "Product"}
                  </div>
                  <div className="text-xs text-[var(--color-fg-muted)] mt-0.5 truncate">
                    {it.fileNameSnapshot || "—"} · {it.downloadCount} downloads
                  </div>
                </div>
                <span className="font-mono text-xs tabular-nums text-[var(--color-fg-muted)]">
                  {formatPrice(it.priceAtPurchase, order.currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-3">
              Customer
            </div>
            <Link
              href={`/admin/store/customers#${order.customerId}`}
              className="block hover:text-[var(--color-accent)] transition-colors"
            >
              <div className="font-medium text-sm truncate">
                {order.customer.name || order.customer.email.split("@")[0]}
              </div>
              <div className="text-xs text-[var(--color-fg-muted)] truncate">
                {order.customer.email}
              </div>
            </Link>
          </section>

          {order.stripeSessionId && (
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-3">
                Stripe
              </div>
              <div className="text-xs text-[var(--color-fg-muted)] font-mono truncate mb-3">
                {order.stripeSessionId}
              </div>
              <a
                href={`https://dashboard.stripe.com/payments/${order.stripePaymentIntent ?? order.stripeSessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline"
              >
                Open in Stripe
                <ExternalLink size={11} />
              </a>
            </section>
          )}

          <OrderActions
            orderId={order.id}
            status={order.status}
            hasStripeSession={!!order.stripeSessionId}
          />
        </aside>
      </div>
    </div>
  );
}
