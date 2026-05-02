"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteOwnReview } from "@/app/_actions/reviews";

export function RemoveReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    if (!confirm("Remove your review? You can write a new one anytime.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteOwnReview(reviewId);
        // Server action revalidates the product page → ReviewsSection
        // re-renders, the form reappears, and this row is gone.
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't remove");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium text-[var(--color-fg-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60"
      >
        <Trash2 size={11} />
        {isPending ? "Removing..." : "Remove review"}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
