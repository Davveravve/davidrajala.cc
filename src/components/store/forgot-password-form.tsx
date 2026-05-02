"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { requestResetAction } from "@/app/store/_actions";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await requestResetAction(undefined, fd);
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 text-center">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] mb-4">
          <CheckCircle2 size={20} />
        </div>
        <p className="text-sm">
          If that email exists, you&apos;ll get a reset link shortly.
        </p>
        <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
          Check your inbox (and spam folder).
        </p>
        <Link
          href="/store/login"
          className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[var(--color-border)] text-sm hover:bg-[var(--color-surface-2)] transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 space-y-5"
    >
      <label className="block">
        <span className="block text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--color-fg-muted)] mb-2">
          Email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
      >
        {isPending ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
