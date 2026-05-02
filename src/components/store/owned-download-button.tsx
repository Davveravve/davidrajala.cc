"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { mintDownload } from "@/app/store/[slug]/actions";

export function OwnedDownloadButton({
  orderItemId,
  orderId,
  remaining,
}: {
  orderItemId: string;
  orderId: string;
  remaining: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function download() {
    setError(null);
    startTransition(async () => {
      try {
        const url = await mintDownload(orderItemId);
        window.location.href = url;
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not start download",
        );
      }
    });
  }

  if (remaining <= 0) {
    return (
      <div className="space-y-3">
        <span className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full border border-[var(--color-border)] text-[var(--color-fg-muted)] text-sm font-medium">
          Limit reached
        </span>
        <Link
          href={`/store/orders/${orderId}`}
          className="block text-center text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          View order
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={download}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Preparing…
          </>
        ) : (
          <>
            <Download size={14} />
            Download
          </>
        )}
      </button>
      <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
        <span>{remaining} downloads left</span>
        <Link
          href={`/store/orders/${orderId}`}
          className="hover:text-[var(--color-accent)] transition-colors"
        >
          View order
        </Link>
      </div>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}
