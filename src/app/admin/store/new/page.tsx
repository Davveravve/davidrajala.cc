import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StoreProductForm } from "@/components/admin/store-product-form";

export const metadata = { title: "New product — Admin" };

export default function NewStoreProductPage() {
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
          New product
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Create product
        </h1>
      </div>
      <StoreProductForm mode="create" />
    </div>
  );
}
