"use client";

import { useState } from "react";
import { ShoppingBag, AlertCircle } from "lucide-react";

export function BuyButton({ productId, title }: { productId: string; title: string }) {
  const [open, setOpen] = useState(false);
  void productId;
  void title;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow"
      >
        <ShoppingBag size={14} />
        Buy now
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                <AlertCircle size={16} />
              </span>
              <h3 className="font-display text-xl font-medium">Checkout coming soon</h3>
            </div>
            <p className="text-sm text-[var(--color-fg-muted)] mb-6 leading-relaxed">
              Stripe checkout is being set up. In the meantime, drop a message via the chat
              and the owner will hook you up directly.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
