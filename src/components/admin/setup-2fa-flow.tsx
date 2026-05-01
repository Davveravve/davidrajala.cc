"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AlertCircle, Check, Copy, KeyRound, Lock } from "lucide-react";
import { CodeInput } from "./code-input";
import { startSetup, confirmSetup } from "@/app/_actions/setup-2fa";

type Stage = "password" | "qr";

export function Setup2faFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  function submitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await startSetup(password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setQrSvg(res.qrSvg);
      setSecret(res.secret);
      setStage("qr");
    });
  }

  function submitCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await confirmSetup(code);
      if (!res.ok) {
        setError(res.error);
        setCode("");
        return;
      }
      await signOut({ redirect: false });
      router.replace("/admin/login");
      router.refresh();
    });
  }

  function copySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret).catch(() => {});
    setCopied(true);
  }

  if (stage === "password") {
    return (
      <form
        onSubmit={submitPassword}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 space-y-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-accent)]">
              <Lock size={14} />
            </span>
            <h3 className="font-display text-lg font-medium">Confirm password</h3>
          </div>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Before we generate your 2FA secret — confirm your password one more time.
          </p>
        </div>
        <input
          type="password"
          autoFocus
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-6 py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] font-medium hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
        >
          {isPending ? "Generating..." : "Continue"}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={submitCode}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 space-y-7"
    >
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-accent)]">
            <KeyRound size={14} />
          </span>
          <h3 className="font-display text-lg font-medium">Step 1 — Scan</h3>
        </div>
        <div className="flex justify-center">
          <div className="rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] p-5">
            {qrSvg && (
              <div
                className="w-[240px] h-[240px]"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )}
          </div>
        </div>
        {secret && (
          <div className="mt-4 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
            <span className="font-mono text-xs text-[var(--color-fg-muted)] truncate">
              {secret}
            </span>
            <button
              type="button"
              onClick={copySecret}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs uppercase tracking-wider hover:text-[var(--color-accent)] transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
        <p className="mt-2 text-xs text-[var(--color-fg-muted)] text-center">
          Can&apos;t scan? Enter the code manually in your authenticator app.
        </p>
      </div>

      <div className="border-t border-[var(--color-border)]" />

      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-accent)]">
            <span className="font-mono text-xs">2</span>
          </span>
          <h3 className="font-display text-lg font-medium">Step 2 — Verify</h3>
        </div>
        <p className="text-sm text-[var(--color-fg-muted)] mb-5 text-center">
          Enter the 6-digit code from your app.
        </p>
        <CodeInput value={code} onChange={setCode} autoFocus hasError={!!error} disabled={isPending} />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || code.length !== 6}
        className="w-full px-6 py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] font-medium hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Activating..." : "Activate 2FA"}
      </button>
    </form>
  );
}
