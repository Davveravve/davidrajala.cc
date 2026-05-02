"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Check, Trash2, Upload, AlertCircle, Package } from "lucide-react";
import {
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
} from "@/app/admin/store/actions";
import { ConfirmDialog } from "./confirm-dialog";
import { useRouter } from "next/navigation";
import { formatFileSize } from "@/lib/format-price";

type Input = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  coverUrl: string;
  fileName: string;
  fileSize: number;
  externalUrl: string | null;
  published: boolean;
  featured: boolean;
};

type Props =
  | { mode: "create"; product?: undefined }
  | { mode: "edit"; product: Input };

export function StoreProductForm(props: Props) {
  const { mode } = props;
  const product = mode === "edit" ? props.product : undefined;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    product?.coverUrl || null,
  );
  const [pendingDelete, setPendingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverPreview(URL.createObjectURL(f));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createStoreProduct(fd);
        } else {
          await updateStoreProduct(product!.id, fd);
          setSavedAt(Date.now());
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  async function confirmDelete() {
    if (mode !== "edit") return;
    await deleteStoreProduct(product!.id);
    router.replace("/admin/store");
  }

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        <Card title="Basic info">
          <Field label="Title" name="title" defaultValue={product?.title} required />
          <Field
            label="Slug (URL)"
            name="slug"
            defaultValue={product?.slug}
            help="Leave empty to derive from title."
          />
          <Field
            label="Summary"
            name="summary"
            defaultValue={product?.summary}
            as="textarea"
            rows={2}
            placeholder="One-line pitch shown on the catalog grid"
          />
          <Field
            label="Description"
            name="description"
            defaultValue={product?.description}
            as="textarea"
            rows={8}
            placeholder="Full description shown on the product page"
          />
        </Card>

        <Card title="Cover image">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <FileInput
                label="Upload cover"
                name="coverFile"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={onCover}
              />
              <Field
                label="Or URL"
                name="coverUrl"
                defaultValue={product?.coverUrl}
                placeholder="https://..."
              />
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)]">
              {coverPreview ? (
                <Image
                  src={coverPreview}
                  alt=""
                  fill
                  sizes="50vw"
                  className="object-cover"
                  unoptimized={coverPreview.startsWith("blob:")}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[var(--color-fg-dim)]">
                  No cover yet
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card title="Pricing & category">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="Price (in öre / cents)"
              name="price"
              type="number"
              defaultValue={String(product?.price ?? 0)}
              help="2900 = 29.00 SEK · 1499 = 14.99 USD"
              required
            />
            <Field
              label="Currency"
              name="currency"
              defaultValue={product?.currency ?? "SEK"}
              placeholder="SEK"
              help="3-letter code"
            />
            <Select
              label="Category"
              name="category"
              defaultValue={product?.category ?? "other"}
              options={[
                { label: "Game", value: "game" },
                { label: "Asset pack", value: "asset" },
                { label: "Program", value: "program" },
                { label: "Other", value: "other" },
              ]}
            />
          </div>
          <Field
            label="External buy URL (optional)"
            name="externalUrl"
            defaultValue={product?.externalUrl ?? ""}
            placeholder="https://gumroad.com/..."
            help="Set this to redirect to an external store (Gumroad, Itch.io, Steam) instead of using on-site checkout."
          />
        </Card>

        <Card title="Product file">
          <div className="space-y-3">
            <FileInput
              label={product?.fileName ? "Replace file" : "Upload file"}
              name="productFile"
              accept="*/*"
            />
            {product?.fileName && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm">
                <Package size={14} className="text-[var(--color-fg-muted)]" />
                <span className="flex-1 truncate">{product.fileName}</span>
                <span className="text-xs text-[var(--color-fg-muted)] tabular-nums">
                  {formatFileSize(product.fileSize)}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card title="Visibility">
          <div className="flex flex-wrap gap-4">
            <Toggle
              label="Published"
              name="published"
              defaultChecked={product?.published ?? true}
              help="Visible in /store"
            />
            <Toggle
              label="Featured"
              name="featured"
              defaultChecked={product?.featured ?? false}
              help="Pinned at the top of the store"
            />
          </div>
        </Card>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 sticky bottom-6 bg-[var(--color-bg)]/80 backdrop-blur-sm py-4 px-2 rounded-2xl border border-[var(--color-border)]">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => setPendingDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={12} />
              Delete product
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            {savedAt && (
              <span
                key={savedAt}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-accent)]"
              >
                <Check size={12} />
                Saved
              </span>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
            >
              {isPending
                ? "Saving..."
                : mode === "create"
                  ? "Create product"
                  : "Save changes"}
            </button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={pendingDelete}
        title="Delete product"
        description={
          mode === "edit"
            ? `Permanently remove "${product?.title}"? Past orders are kept.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <header className="px-6 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-display text-base font-medium">{title}</h3>
      </header>
      <div className="p-6 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  help,
  as = "input",
  type = "text",
  rows,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  help?: string;
  as?: "input" | "textarea";
  type?: string;
  rows?: number;
}) {
  const cls =
    "w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all";
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-[var(--color-accent)] ml-1">*</span>}
      </span>
      {as === "textarea" ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          required={required}
          rows={rows ?? 4}
          className={`${cls} resize-y`}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          required={required}
          className={cls}
        />
      )}
      {help && <span className="block text-xs text-[var(--color-fg-muted)] mt-1.5">{help}</span>}
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  name,
  defaultChecked,
  help,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
  help?: string;
}) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-border-strong)] transition-colors">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="relative h-5 w-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] peer-checked:bg-[var(--color-accent)] peer-checked:border-[var(--color-accent)] transition-colors">
        <span className="absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-[var(--color-fg)] peer-checked:translate-x-4 transition-transform" />
      </span>
      <div>
        <div className="text-sm font-medium">{label}</div>
        {help && <div className="text-xs text-[var(--color-fg-muted)]">{help}</div>}
      </div>
    </label>
  );
}

function FileInput({
  label,
  name,
  accept,
  onChange,
}: {
  label: string;
  name: string;
  accept?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <div className="relative flex items-center justify-center px-4 py-6 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer text-sm text-[var(--color-fg-muted)]">
        <Upload size={16} className="mr-2" />
        Click or drop a file
        <input
          type="file"
          name={name}
          accept={accept}
          onChange={onChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </label>
  );
}
