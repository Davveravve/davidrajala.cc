"use client";

import { useState, useTransition } from "react";
import { Gift, X, AlertCircle } from "lucide-react";
import { giftOrderToCustomer } from "@/app/admin/store/orders/actions";

type ProductOption = {
  id: string;
  title: string;
  fileName: string;
};

export function GiftOrderButton({
  customerId,
  customerLabel,
  products,
}: {
  customerId: string;
  customerLabel: string;
  products: ProductOption[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("customerId", customerId);
    startTransition(async () => {
      try {
        await giftOrderToCustomer(fd);
        // The action redirects on success; if it returns we'll just close.
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to gift order");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors flex-shrink-0"
        title="Gift an order"
      >
        <Gift size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                    <Gift size={16} />
                  </span>
                  <h3 className="font-display text-xl font-medium">Gift order</h3>
                </div>
                <p className="text-xs text-[var(--color-fg-muted)] truncate">
                  Grant {customerLabel} access to a product as if they bought it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">
                  Product
                </span>
                <select
                  name="productId"
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Pick a product…
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                      {p.fileName ? ` — ${p.fileName}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">
                  Message to customer (optional)
                </span>
                <textarea
                  name="noteToCustomer"
                  maxLength={500}
                  rows={3}
                  placeholder="Hey! Thanks for being awesome — here's a copy on me."
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none text-sm resize-y"
                />
                <span className="block text-[11px] text-[var(--color-fg-muted)] mt-1.5">
                  Shown to the customer on their order page.
                </span>
              </label>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
                  <AlertCircle size={12} />
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
                >
                  {isPending ? "..." : "Gift order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
