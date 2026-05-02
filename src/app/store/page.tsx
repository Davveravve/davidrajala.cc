import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SectionLabel } from "@/components/ui/section-label";
import { Reveal } from "@/components/ui/reveal";
import { formatPrice, categoryLabel } from "@/lib/format-price";

export const metadata = {
  title: "Store",
  description: "Games, asset packs and programs by David Rajala.",
};

export default async function StorePage() {
  const products = await prisma.storeProduct.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-fine opacity-40" aria-hidden />
        <div className="absolute inset-0 bg-radial-fade" aria-hidden />
        <div className="container-page relative">
          <SectionLabel className="mb-6">Portfolio / Store</SectionLabel>
          <Reveal>
            <h1 className="font-display text-4xl sm:text-5xl md:text-8xl font-medium tracking-tight text-balance leading-[0.95]">
              Things I&apos;ve <br />
              <span className="text-[var(--color-fg-muted)]">made for sale.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 text-lg text-[var(--color-fg-muted)] max-w-2xl">
              Games, asset packs, programs and other one-off creations. Pay once, download forever.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative pb-32">
        <div className="container-page">
          {products.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
                <Reveal key={p.id} className="h-full">
                  <Link
                    href={`/store/${p.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors duration-300 hover:border-[var(--color-accent)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {p.coverUrl ? (
                        <Image
                          src={p.coverUrl}
                          alt={p.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-grid" aria-hidden />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/30 to-transparent" />
                      {p.featured && (
                        <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-[var(--color-bg)]/80 backdrop-blur-sm border border-[var(--color-accent)]/30 text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-accent)]">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5 md:p-6">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)]">
                          {categoryLabel(p.category)}
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-fg-muted)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)] group-hover:rotate-45 transition-all duration-500">
                          <ArrowUpRight size={12} />
                        </span>
                      </div>
                      <h3 className="font-display text-xl md:text-2xl font-medium tracking-tight mb-1.5 group-hover:text-[var(--color-accent)] transition-colors">
                        {p.title}
                      </h3>
                      {p.summary && (
                        <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed line-clamp-2 mb-4">
                          {p.summary}
                        </p>
                      )}
                      <div className="mt-auto pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                        <span className="font-display text-lg font-medium text-[var(--color-fg)]">
                          {formatPrice(p.price, p.currency)}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-accent)]">
                          View details →
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-20 text-center">
      <div className="font-display text-2xl mb-2">Store opens soon</div>
      <p className="text-sm text-[var(--color-fg-muted)] max-w-sm mx-auto">
        Working on the first products. Check back later.
      </p>
    </div>
  );
}
