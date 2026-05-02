import { redirect } from "next/navigation";
import Link from "next/link";
import { Download, ShoppingBag, LogOut, Settings, Gift } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { customerLogoutAction } from "@/app/store/_actions";
import { formatPrice } from "@/lib/format-price";
import { signDownloadToken, MAX_DOWNLOADS } from "@/lib/download-tokens";

export const metadata = { title: "Your account" };

export default async function StoreAccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/store/login");

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  const paidOrders = orders.filter((o) => o.status === "paid");
  const downloadEntries = await Promise.all(
    paidOrders
      .flatMap((o) => o.items.map((i) => ({ order: o, item: i })))
      .filter(
        (d) => d.item.fileUrlSnapshot || d.item.product?.fileUrl,
      )
      .map(async (d) => ({
        ...d,
        token: await signDownloadToken(d.item.id, customer.id),
      })),
  );

  return (
    <section className="relative pt-32 pb-32">
      <div className="container-page max-w-4xl">
        <div className="flex items-start justify-between gap-6 mb-10">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
              Store account
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
              {customer.name || customer.email.split("@")[0]}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{customer.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/store/account/profile"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <Settings size={13} />
              Edit profile
            </Link>
            <form action={customerLogoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </form>
          </div>
        </div>

        <Section title="Downloads" subtitle={`${downloadEntries.length} available`}>
          {downloadEntries.length === 0 ? (
            <Empty
              text="No downloads yet."
              cta={{ href: "/store", label: "Browse store" }}
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3">
              {downloadEntries.map(({ order, item, token }) => {
                const remaining = Math.max(0, MAX_DOWNLOADS - item.downloadCount);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {item.product?.title ?? "Product"}
                      </div>
                      <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                        Bought {new Date(order.createdAt).toLocaleDateString("en-GB")}
                        {item.fileNameSnapshot && ` · ${item.fileNameSnapshot}`}
                        {" · "}
                        {remaining}/{MAX_DOWNLOADS} downloads left
                      </div>
                    </div>
                    {remaining > 0 ? (
                      <a
                        href={`/api/store/download/${token}`}
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-medium hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow"
                      >
                        <Download size={12} />
                        Download
                      </a>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)] px-3 py-1 rounded-full border border-[var(--color-border)]">
                        Limit reached
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Order history" subtitle={`${orders.length} total`}>
          {orders.length === 0 ? (
            <Empty text="No orders yet." />
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors"
                >
                  <Link
                    href={`/store/orders/${o.id}`}
                    className="block px-5 py-4 border-b border-[var(--color-border)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">
                          Order #{o.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                          {new Date(o.createdAt).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {o.isGift ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                            <Gift size={10} />
                            Gifted
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded ${statusClass(o.status)}`}
                          >
                            {o.status}
                          </span>
                        )}
                        <span className="font-display text-base tabular-nums">
                          {o.isGift ? "Free" : formatPrice(o.totalAmount, o.currency)}
                        </span>
                      </div>
                    </div>
                    {o.isGift && o.giftNote && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-[var(--color-fg-muted)] leading-relaxed">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex-shrink-0 mt-0.5">
                          <Gift size={11} />
                        </span>
                        <span className="line-clamp-2 italic">
                          “{o.giftNote}”
                        </span>
                      </div>
                    )}
                  </Link>
                  <ul className="px-5 py-3 divide-y divide-[var(--color-border)]">
                    {o.items.map((it) => (
                      <li
                        key={it.id}
                        className="py-2 text-sm flex items-center justify-between"
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
        </Section>
      </div>
    </section>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-lg font-medium">{title}</h2>
        {subtitle && (
          <span className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] mb-3">
        <ShoppingBag size={18} />
      </div>
      <p className="text-sm text-[var(--color-fg-muted)] mb-3">{text}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-medium hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow"
        >
          {cta.label}
        </Link>
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
