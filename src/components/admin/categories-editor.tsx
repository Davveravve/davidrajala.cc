"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Check, Pencil, X } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/_actions/categories";
import { TwoFactorPrompt } from "./two-factor-prompt";

type Cat = { id: string; name: string; slug: string; count: number };

export function CategoriesEditor({ categories }: { categories: Cat[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Cat | null>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createCategory(fd);
        (e.target as HTMLFormElement).reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunde inte skapa");
      }
    });
  }

  function askDelete(c: Cat) {
    setPendingDelete(c);
  }

  return (
    <>
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 mb-6"
      >
        <h3 className="font-display text-base font-medium mb-4">New category</h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            name="name"
            required
            placeholder="Name (e.g. Web)"
            className="px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none"
          />
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            placeholder="slug (web)"
            className="px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] font-mono focus:border-[var(--color-accent)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
        {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
      </form>

      <ul className="space-y-2">
        {categories.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            {editingId === c.id ? (
              <EditRow
                cat={c}
                onCancel={() => setEditingId(null)}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{c.name}</span>
                  <span className="font-mono text-xs text-[var(--color-fg-dim)]">/{c.slug}</span>
                  <span className="text-xs text-[var(--color-fg-muted)] px-2 py-0.5 rounded-full bg-[var(--color-surface-2)]">
                    {c.count} {c.count === 1 ? "project" : "projects"}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingId(c.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => askDelete(c)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {categories.length === 0 && (
        <div className="text-center py-12 text-sm text-[var(--color-fg-muted)]">
          No categories yet.
        </div>
      )}

      <TwoFactorPrompt
        open={pendingDelete !== null}
        title="Delete category"
        description={
          pendingDelete
            ? pendingDelete.count > 0
              ? `"${pendingDelete.name}" is used by ${pendingDelete.count} projects — those projects will become uncategorized.`
              : `Delete "${pendingDelete.name}"?`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onSubmit={async (code) => {
          if (!pendingDelete) return;
          await deleteCategory(pendingDelete.id, code);
          setPendingDelete(null);
        }}
      />
    </>
  );
}

function EditRow({
  cat,
  onCancel,
  onDone,
}: {
  cat: Cat;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateCategory(cat.id, fd);
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-2">
      <input
        name="name"
        defaultValue={cat.name}
        required
        className="px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none"
      />
      <input
        name="slug"
        defaultValue={cat.slug}
        pattern="[a-z0-9-]+"
        required
        className="px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] font-mono focus:border-[var(--color-accent)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-sm"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm"
      >
        <X size={14} />
      </button>
    </form>
  );
}
