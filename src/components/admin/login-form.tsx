"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, ArrowRight, Lock } from "lucide-react";
import { CodeInput } from "./code-input";

export function LoginForm({ has2fa }: { has2fa: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function safeRedirectTarget() {
    const fromRaw = params.get("from") ?? "";
    if (fromRaw.startsWith("/") && !fromRaw.startsWith("//")) return fromRaw;
    return "/admin";
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await signIn("credentials", {
        password: has2fa ? "" : password,
        code: has2fa ? code : "",
        redirect: false,
      });

      if (res?.error) {
        setError(has2fa ? "Invalid code" : "Wrong password");
        if (has2fa) setCode("");
        return;
      }

      router.push(safeRedirectTarget());
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {has2fa ? (
        <div>
          <span className="block text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3 text-center">
            6-digit code
          </span>
          <CodeInput value={code} onChange={setCode} autoFocus hasError={!!error} disabled={isPending} />
        </div>
      ) : (
        <label className="block">
          <span className="block text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-2">
            Password
          </span>
          <div className="relative">
            <Lock
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-fg-dim)]"
            />
            <input
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
            />
          </div>
        </label>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || (has2fa ? code.length !== 6 : password.length === 0)}
        className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] font-medium hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending
          ? has2fa
            ? "Verifying..."
            : "Signing in..."
          : has2fa
            ? "Verify & sign in"
            : "Continue"}
        {!isPending && (
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        )}
      </button>

    </form>
  );
}
