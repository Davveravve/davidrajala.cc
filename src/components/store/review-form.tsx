"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Trash2 } from "lucide-react";
import { StarPicker } from "@/components/ui/star-rating";
import { submitReview, deleteOwnReview } from "@/app/_actions/reviews";

export function ReviewForm({
  productId,
  existing,
}: {
  productId: string;
  existing: { id: string; rating: number; title: string; body: string } | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Pick a star rating first");
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set("productId", productId);
    fd.set("rating", String(rating));
    startTransition(async () => {
      try {
        await submitReview(fd);
        setSavedAt(Date.now());
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save review");
      }
    });
  }

  function onDelete() {
    if (!existing) return;
    setPendingDelete(true);
    startTransition(async () => {
      try {
        await deleteOwnReview(existing.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      } finally {
        setPendingDelete(false);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 mb-8 space-y-4"
    >
      <div>
        <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-2">
          {existing ? "Your review" : "Write a review"}
        </div>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <label className="block">
        <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">
          Title (optional)
        </span>
        <input
          name="title"
          defaultValue={existing?.title ?? ""}
          maxLength={120}
          placeholder="Summed up in a sentence"
          className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none transition-colors text-sm"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">
          Tell others what you think
        </span>
        <textarea
          name="body"
          defaultValue={existing?.body ?? ""}
          maxLength={4000}
          rows={4}
          placeholder="What worked for you, what didn't, what surprised you…"
          className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none transition-colors text-sm resize-y"
        />
      </label>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--color-border)]">
        {existing ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending || pendingDelete}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60"
          >
            <Trash2 size={12} />
            Delete review
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
          >
            {isPending ? "Saving..." : existing ? "Update review" : "Post review"}
          </button>
        </div>
      </div>
    </form>
  );
}
