import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download, RefreshCw, Gift } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { signDownloadToken, MAX_DOWNLOADS } from "@/lib/download-tokens";
import { formatPrice } from "@/lib/format-price";

export const metadata = { title: "Order" };

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/store/login");

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, customerId: customer.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) redirect("/store/account");

  // Mark the gift notification as seen (no-op for non-gift orders).
  if (order.notifyCustomer) {
    await prisma.order.update({
      where: { id: order.id },
      data: { notifyCustomer: false },
    }).catch(() => {});
  }

  const itemsWithTokens = await Promise.all(
    order.items.map(async (it) => ({
      item: it,
      token:
        order.status === "paid" && (it.fileUrlSnapshot || it.product?.fileUrl)
          ? await signDownloadToken(it.id, customer.id)
          : null,
    })),
  );

  return (
    <section className="relative pt-32 pb-24">
      <div className="container-page max-w-3xl">
        <Link
          href="/store/account"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to account
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

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded ${statusClass(order.status)}`}
              >
                {order.status}
              </span>
              {order.isGift && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                  <Gift size={10} />
                  Gifted
                </span>
              )}
            </div>
            <span className="font-display text-lg tabular-nums">
              {order.isGift ? "Free" : formatPrice(order.totalAmount, order.currency)}
            </span>
          </div>

          {order.isGift && order.giftNote && (
            <GiftNotice note={order.giftNote} />
          )}
          {order.status === "pending" && !order.isGift && (
            <PendingNotice />
          )}
          {order.status === "failed" && <FailedNotice />}

          <ul className="divide-y divide-[var(--color-border)]">
            {itemsWithTokens.map(({ item, token }) => {
              const remaining = Math.max(0, MAX_DOWNLOADS - item.downloadCount);
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {item.product?.title ?? "Product"}
                    </div>
                    <div className="text-xs text-[var(--color-fg-muted)] mt-0.5 truncate">
                      {item.fileNameSnapshot || item.product?.fileName || "—"}
                      {token && ` · ${remaining}/${MAX_DOWNLOADS} downloads left`}
                    </div>
                  </div>
                  {token && remaining > 0 ? (
                    <a
                      href={`/api/store/download/${token}`}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-medium hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow"
                    >
                      <Download size={12} />
                      Download
                    </a>
                  ) : token ? (
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)] px-3 py-1 rounded-full border border-[var(--color-border)]">
                      Limit reached
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)] px-3 py-1 rounded-full border border-[var(--color-border)]">
                      {order.status === "pending" ? "Pending payment" : "Unavailable"}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PendingNotice() {
  return (
    <div className="px-5 py-3 border-b border-[var(--color-border)] bg-orange-500/5 text-orange-300 text-xs flex items-center gap-2">
      <RefreshCw size={12} />
      Waiting for payment confirmation. If you completed checkout, refresh
      this page in a moment — Stripe normally confirms within seconds.
    </div>
  );
}

function GiftNotice({ note }: { note: string }) {
  return (
    <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-accent)]/5 text-[var(--color-fg)]">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex-shrink-0">
          <Gift size={13} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-accent)] mb-1">
            Gifted to you
          </div>
          <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed whitespace-pre-wrap">
            {note}
          </p>
        </div>
      </div>
    </div>
  );
}

function FailedNotice() {
  return (
    <div className="px-5 py-3 border-b border-[var(--color-border)] bg-red-500/5 text-red-400 text-xs">
      This order didn&apos;t complete. Try buying again from the store, or
      reach out via the chat.
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
