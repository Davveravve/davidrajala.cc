import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, categoryLabel } from "@/lib/format-price";
import { StoreTabs } from "@/components/admin/store-tabs";

export const metadata = { title: "Store — Admin" };

export default async function AdminStorePage() {
  const products = await prisma.storeProduct.findMany({
    orderBy: [{ featured: "desc" }, { order: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="container-page max-w-7xl py-8 md:py-12">
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Manage
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Store
        </h1>
      </div>

      <StoreTabs />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <p className="text-sm text-[var(--color-fg-muted)] max-w-2xl">
          Products you sell on /store. File and cover are uploaded here.
        </p>
        <Link
          href="/admin/store/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow self-start"
        >
          <Plus size={16} />
          New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] mb-4">
            <ShoppingBag size={22} />
          </div>
          <div className="font-display text-2xl mb-2">No products yet</div>
          <p className="text-sm text-[var(--color-fg-muted)] mb-6">
            Add your first product to start selling.
          </p>
          <Link
            href="/admin/store/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm"
          >
            <Plus size={14} />
            Add product
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 pr-5 hover:border-[var(--color-border-strong)] transition-colors"
            >
              <div className="relative h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden border border-[var(--color-border)]">
                {p.coverUrl ? (
                  <Image
                    src={p.coverUrl}
                    alt={p.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-grid-fine opacity-50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{p.title}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-fg-muted)] px-1.5 py-0.5 rounded bg-[var(--color-surface-2)]">
                    {categoryLabel(p.category)}
                  </span>
                  {!p.published && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-orange-300 border border-orange-300/40 px-1.5 py-0.5 rounded">
                      draft
                    </span>
                  )}
                  {p.featured && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent)] border border-[var(--color-accent)]/40 px-1.5 py-0.5 rounded">
                      featured
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-fg-muted)] truncate">
                  {formatPrice(p.price, p.currency)} · {p._count.items} sold
                </div>
              </div>
              <Link
                href={`/admin/store/${p.id}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <Pencil size={14} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
