"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw, AlertCircle, Ban, RotateCcw } from "lucide-react";
import { setOrderStatus, syncOrderFromStripe } from "@/app/admin/store/orders/actions";

const STATUSES: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export function OrderActions({
  orderId,
  status,
  hasStripeSession,
}: {
  orderId: string;
  status: string;
  hasStripeSession: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function changeStatus(next: string) {
    if (next === status) return;
    setError(null);
    setInfo(null);
    startTransition(async () => {
      try {
        await setOrderStatus(orderId, next);
        setInfo(`Status set to ${next}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  function sync() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      try {
        const result = await syncOrderFromStripe(orderId);
        setInfo(`Synced from Stripe: ${result}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sync failed");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-3">
          Status
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {STATUSES.map((s) => {
            const active = s.value === status;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => changeStatus(s.value)}
                disabled={isPending}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? statusActiveClass(s.value)
                    : "text-[var(--color-fg-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {hasStripeSession && (
        <button
          type="button"
          onClick={sync}
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] text-sm font-medium transition-colors disabled:opacity-60"
          title="Pull the latest payment status from Stripe and update this order"
        >
          <RefreshCw size={13} className={isPending ? "animate-spin" : ""} />
          Sync from Stripe
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
      {info && !error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-[var(--color-accent)] text-xs">
          <Check size={12} />
          {info}
        </div>
      )}

      <p className="text-[11px] text-[var(--color-fg-muted)] leading-relaxed">
        Webhooks normally update this automatically. Use{" "}
        <span className="text-[var(--color-fg)]">Sync from Stripe</span> if a
        webhook didn&apos;t arrive but the payment shows up in Stripe.
      </p>
    </section>
  );
}

// Visual hint reused from list view.
function statusActiveClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/40";
    case "pending":
      return "bg-orange-500/10 text-orange-300 border border-orange-300/40";
    case "failed":
      return "bg-red-500/10 text-red-400 border border-red-400/40";
    case "refunded":
      return "bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] border border-[var(--color-border-strong)]";
    default:
      return "bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]";
  }
}

void Ban;
void RotateCcw;
