import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Download, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { signDownloadToken } from "@/lib/download-tokens";
import { formatPrice } from "@/lib/format-price";

export const metadata = { title: "Order complete" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; session?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/store/login");

  const sp = await searchParams;
  const orderId = String(sp.order ?? "");
  if (!orderId) redirect("/store/account");

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: customer.id },
    include: {
      items: { include: { product: true } },
    },
  });
  if (!order) redirect("/store/account");

  // Build per-item signed download tokens up-front (only for paid orders).
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
      <div className="container-page max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] mb-5">
            <Check size={26} />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
            {order.status === "paid" ? "Thanks for your purchase!" : "Order received"}
          </h1>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
            {order.status === "paid"
              ? "Your downloads are ready below and on your account page."
              : "Payment is processing — refresh in a few seconds, or check your account."}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">
                Order #{order.id.slice(0, 8)}
              </div>
              <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                {new Date(order.createdAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <span className="font-display text-lg tabular-nums">
              {formatPrice(order.totalAmount, order.currency)}
            </span>
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {itemsWithTokens.map(({ item, token }) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {item.product?.title ?? "Product"}
                  </div>
                  <div className="text-xs text-[var(--color-fg-muted)] mt-0.5 truncate">
                    {item.fileNameSnapshot || item.product?.fileName || "—"}
                  </div>
                </div>
                {token ? (
                  <a
                    href={`/api/store/download/${token}`}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-medium hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow"
                  >
                    <Download size={12} />
                    Download
                  </a>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                    Pending
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <Link
            href="/store/account"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            View all orders
            <ArrowUpRight size={13} />
          </Link>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)] text-sm transition-colors"
          >
            Back to store
          </Link>
        </div>
      </div>
    </section>
  );
}
