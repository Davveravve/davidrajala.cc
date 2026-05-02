"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, AlertCircle } from "lucide-react";
import { addComment } from "@/app/_actions/comments";

export function CommentForm({
  parentType,
  parentId,
}: {
  parentType: "project" | "gallery";
  parentId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) {
      setError("Say something first");
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await addComment(fd);
        setBody("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="parentType" value={parentType} />
      <input type="hidden" name="parentId" value={parentId} />
      <label className="block">
        <span className="sr-only">Your comment</span>
        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={4000}
          rows={3}
          placeholder="Share your thoughts…"
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none transition-colors text-sm resize-y"
        />
      </label>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-[var(--color-fg-muted)] tabular-nums">
          {body.length} / 4000
        </span>
        <button
          type="submit"
          disabled={isPending || body.trim().length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
        >
          <Send size={13} />
          {isPending ? "Posting..." : "Post comment"}
        </button>
      </div>
    </form>
  );
}
