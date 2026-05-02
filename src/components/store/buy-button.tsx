"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, AlertCircle, Loader2 } from "lucide-react";

export function BuyButton({ productId, title }: { productId: string; title: string }) {
  void title;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function buy() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/store/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const data = await res.json();
        if (res.status === 401 && data.redirect) {
          router.push(data.redirect);
          return;
        }
        if (!res.ok) {
          setError(data.error || "Could not start checkout");
          return;
        }
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError("Checkout URL missing — try again.");
        }
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={buy}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Redirecting…
          </>
        ) : (
          <>
            <ShoppingBag size={14} />
            Buy now
          </>
        )}
      </button>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}
