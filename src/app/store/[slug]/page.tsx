import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink as ExternalLinkIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/ui/reveal";
import { formatPrice, formatFileSize, categoryLabel } from "@/lib/format-price";
import { BuyButton } from "@/components/store/buy-button";
import { OwnedDownloadButton } from "@/components/store/owned-download-button";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { MAX_DOWNLOADS } from "@/lib/download-tokens";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await prisma.storeProduct.findUnique({
    where: { slug },
  });
  if (!p) return {};
  return {
    title: p.title,
    description: p.summary || `${p.title} — by David Rajala`,
    openGraph: {
      title: p.title,
      description: p.summary,
      images: p.coverUrl ? [p.coverUrl] : [],
    },
  };
}

export default async function StoreProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.storeProduct.findUnique({
    where: { slug },
  });
  if (!product || !product.published) notFound();

  const paragraphs = product.description
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const customer = await getCurrentCustomer();
  const ownedItem = customer
    ? await prisma.orderItem.findFirst({
        where: {
          productId: product.id,
          order: { customerId: customer.id, status: "paid" },
        },
        include: { order: { select: { id: true } } },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const remaining = ownedItem
    ? Math.max(0, MAX_DOWNLOADS - ownedItem.downloadCount)
    : 0;
  const owns = !!ownedItem;

  return (
    <article className="relative">
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-fine opacity-30" aria-hidden />
        <div className="container-page relative">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-12 group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            All store items
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7">
              <Reveal>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
                  {product.coverUrl ? (
                    <Image
                      src={product.coverUrl}
                      alt={product.title}
                      fill
                      priority
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-grid" aria-hidden />
                  )}
                </div>
              </Reveal>
            </div>

            <aside className="lg:col-span-5 lg:pt-2">
              <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-4 flex items-center gap-3">
                <span className="h-px w-8 bg-[var(--color-accent)]" />
                {categoryLabel(product.category)}
              </div>
              <Reveal>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] text-balance">
                  {product.title}
                </h1>
              </Reveal>
              {product.summary && (
                <Reveal delay={0.1}>
                  <p className="mt-5 text-lg text-[var(--color-fg-muted)] leading-relaxed text-pretty">
                    {product.summary}
                  </p>
                </Reveal>
              )}

              <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5">
                {owns && !product.externalUrl && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                    Owned
                  </span>
                )}
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-3xl font-medium tabular-nums">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  {product.fileSize > 0 && (
                    <span className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
                      {formatFileSize(product.fileSize)}
                      {owns && !product.externalUrl && (
                        <> · {remaining} downloads remaining</>
                      )}
                    </span>
                  )}
                </div>

                {product.externalUrl ? (
                  <a
                    href={product.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow"
                  >
                    <ExternalLinkIcon size={14} />
                    Buy on external site
                  </a>
                ) : ownedItem ? (
                  <OwnedDownloadButton
                    orderItemId={ownedItem.id}
                    orderId={ownedItem.order.id}
                    remaining={remaining}
                  />
                ) : (
                  <BuyButton productId={product.id} title={product.title} />
                )}

                {product.fileName && (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)] pt-2 border-t border-[var(--color-border)]">
                    <Download size={12} />
                    <span className="truncate">Includes {product.fileName}</span>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {paragraphs.length > 0 && (
        <section className="relative py-16">
          <div className="container-page max-w-3xl">
            <Reveal>
              <div className="space-y-5">
                {paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="text-lg text-[var(--color-fg-muted)] leading-relaxed text-pretty"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section className="relative pb-32">
        <div className="container-page">
          <Link
            href="/store"
            className="group flex items-center justify-between gap-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 hover:border-[var(--color-accent)] transition-colors"
          >
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-2">
                Back to
              </div>
              <div className="font-display text-3xl md:text-5xl font-medium tracking-tight">
                Store
              </div>
            </div>
          </Link>
        </div>
      </section>
    </article>
  );
}
