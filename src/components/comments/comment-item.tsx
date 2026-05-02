"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteOwnComment } from "@/app/_actions/comments";

export function CommentItem({
  id,
  authorId,
  authorName,
  body,
  createdAt,
  currentCustomerId,
}: {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  currentCustomerId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  const isOwn = currentCustomerId === authorId;
  const initial = (authorName || "?")[0].toUpperCase();

  function onDelete() {
    if (!confirm("Delete this comment?")) return;
    startTransition(async () => {
      try {
        await deleteOwnComment(id);
        setRemoved(true);
        router.refresh();
      } catch {
        // ignore — server returned an error
      }
    });
  }

  if (removed) return null;

  return (
    <li
      className={`rounded-2xl border p-5 ${
        isOwn
          ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <header className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-sm font-medium flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{authorName}</span>
              {isOwn && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-accent)] border border-[var(--color-accent)]/40 px-1.5 py-0.5 rounded">
                  You
                </span>
              )}
            </div>
            <time className="text-[11px] text-[var(--color-fg-dim)] tabular-nums">
              {new Date(createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </time>
          </div>
        </div>
        {isOwn && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        )}
      </header>
      <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed whitespace-pre-wrap">
        {body}
      </p>
    </li>
  );
}
