import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { formatPrice, categoryLabel } from "@/lib/format-price";
import type { HomeSection, StoreProduct } from "@prisma/client";

export function StoreFeatured({
  product,
  config,
}: {
  product: StoreProduct;
  config?: HomeSection | null;
}) {
  const badgeText = config?.eyebrow ?? "For sale";
  const ctaLabel = config?.ctaLabel ?? "View product";

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="container-page">
        <Reveal>
          <Link
            href={`/store/${product.slug}`}
            className="group relative block overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-all duration-500"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[520px] overflow-hidden order-1 lg:order-1">
                {product.coverUrl ? (
                  <Image
                    src={product.coverUrl}
                    alt={product.title}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-grid-fine opacity-40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)]/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[var(--color-surface)]/20 lg:to-[var(--color-surface)]" />
                <div className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg)]/80 backdrop-blur-sm border border-[var(--color-accent)]/30 text-[10px] uppercase tracking-[0.15em] font-medium text-[var(--color-accent)]">
                  <ShoppingBag size={11} />
                  {badgeText}
                </div>
              </div>

              <div className="relative p-8 md:p-12 lg:p-16 flex flex-col justify-between gap-10 order-2 lg:order-2">
                <div>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-6">
                    <span className="h-px w-6 bg-[var(--color-accent)]" />
                    {categoryLabel(product.category)}
                  </div>

                  <h2 className="font-display text-4xl md:text-6xl font-medium tracking-tight text-balance leading-[0.95]">
                    {product.title}
                  </h2>

                  {product.summary && (
                    <p className="mt-6 text-lg text-[var(--color-fg-muted)] leading-relaxed text-pretty max-w-xl">
                      {product.summary}
                    </p>
                  )}

                  <div className="mt-8 inline-flex items-baseline gap-3 px-5 py-3 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]">
                    <span className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)]">
                      Price
                    </span>
                    <span className="font-display text-xl font-medium tabular-nums">
                      {formatPrice(product.price, product.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
                    {ctaLabel}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-fg-muted)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)] group-hover:rotate-45 transition-all duration-500">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
