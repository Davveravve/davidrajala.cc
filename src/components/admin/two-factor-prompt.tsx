"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, AlertCircle, Lock } from "lucide-react";
import { CodeInput } from "./code-input";
import { useAdminContext } from "./admin-context";

export function TwoFactorPrompt({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onSubmit: (verification: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const { has2fa } = useAdminContext();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (open) {
      setCode("");
      setPassword("");
      setError(null);
      setIsPending(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const value = has2fa ? code : password;
  const canSubmit = has2fa ? code.length === 6 : password.length > 0;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsPending(true);
    setError(null);
    try {
      await onSubmit(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      if (has2fa) setCode("");
      else setPassword("");
      setIsPending(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  destructive
                    ? "bg-red-500/10 text-red-400"
                    : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                }`}
              >
                {has2fa ? <ShieldCheck size={16} /> : <Lock size={16} />}
              </span>
              <h3 className="font-display text-xl font-medium">{title}</h3>
            </div>
            {description && (
              <p className="text-sm text-[var(--color-fg-muted)] mb-6">{description}</p>
            )}

            <form onSubmit={submit} className="space-y-5">
              {has2fa ? (
                <div>
                  <span className="block text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3 text-center">
                    6-digit code
                  </span>
                  <CodeInput
                    value={code}
                    onChange={setCode}
                    autoFocus
                    hasError={!!error}
                    disabled={isPending}
                  />
                </div>
              ) : (
                <div>
                  <span className="block text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-2">
                    Password
                  </span>
                  <input
                    type="password"
                    autoFocus
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border text-[15px] placeholder:text-[var(--color-fg-dim)] focus:outline-none transition-colors ${
                      error
                        ? "border-red-500/60 focus:border-red-500"
                        : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                    }`}
                  />
                  <p className="mt-2 text-[11px] text-[var(--color-fg-muted)]">
                    2FA is not enabled — confirming with password for now.
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || isPending}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-shadow disabled:opacity-50 disabled:cursor-not-allowed ${
                    destructive
                      ? "bg-red-500 text-white hover:shadow-[0_0_24px_rgba(239,68,68,0.35)]"
                      : "bg-[var(--color-accent)] text-[var(--color-bg)] hover:shadow-[0_0_30px_var(--color-accent-glow)]"
                  }`}
                >
                  {isPending ? "..." : confirmLabel}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
