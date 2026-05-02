"use client";

import { useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";
import { customerSignupAction, customerLoginAction } from "@/app/store/_actions";

export function CustomerAuthForm({ mode }: { mode: "signup" | "login" }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const action = mode === "signup" ? customerSignupAction : customerLoginAction;
      const result = await action(undefined, fd);
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 space-y-5"
    >
      {mode === "signup" && (
        <Field label="Name (optional)" name="name" type="text" autoComplete="name" />
      )}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        required
        help={mode === "signup" ? "At least 8 characters." : undefined}
      />

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
      >
        {isPending
          ? mode === "signup"
            ? "Creating..."
            : "Signing in..."
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  help,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--color-fg-muted)] mb-2">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
      />
      {help && (
        <span className="block text-[11px] text-[var(--color-fg-muted)] mt-1.5">{help}</span>
      )}
    </label>
  );
}
