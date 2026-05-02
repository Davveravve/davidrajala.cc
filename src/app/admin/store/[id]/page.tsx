import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StoreProductForm } from "@/components/admin/store-product-form";

export default async function EditStoreProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.storeProduct.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div className="container-page max-w-4xl py-8 md:py-12">
      <Link
        href="/admin/store"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Back to store
      </Link>
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Edit
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          {product.title}
        </h1>
      </div>
      <StoreProductForm
        mode="edit"
        product={{
          id: product.id,
          slug: product.slug,
          title: product.title,
          summary: product.summary,
          description: product.description,
          category: product.category,
          price: product.price,
          currency: product.currency,
          coverUrl: product.coverUrl,
          fileName: product.fileName,
          fileSize: product.fileSize,
          externalUrl: product.externalUrl,
          published: product.published,
          featured: product.featured,
        }}
      />
    </div>
  );
}
