"use client";

import { useState, useTransition } from "react";
import { Check, AlertCircle, Copy, ShieldCheck, ShieldAlert } from "lucide-react";
import { updateStripeSettings } from "@/app/admin/settings/stripe/actions";
import type { StripeAdminView } from "@/lib/stripe-config";

export function StripeSettingsForm({
  initial,
  webhookUrl,
}: {
  initial: StripeAdminView;
  webhookUrl: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [mode, setMode] = useState<"test" | "live">(initial.mode);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("enabled", enabled ? "true" : "");
    fd.set("mode", mode);
    startTransition(async () => {
      try {
        await updateStripeSettings(fd);
        setSavedAt(Date.now());
        // Clear the secret-input fields visually after save (server already
        // stored them encrypted).
        const form = e.currentTarget;
        const sk = form?.querySelector<HTMLInputElement>("[name=secretKey]");
        const wh = form?.querySelector<HTMLInputElement>("[name=webhookSecret]");
        if (sk) sk.value = "";
        if (wh) wh.value = "";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  async function copyWebhook() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="Status">
        <label className="inline-flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-border-strong)] transition-colors">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="peer sr-only"
          />
          <span className="relative h-5 w-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] peer-checked:bg-[var(--color-accent)] peer-checked:border-[var(--color-accent)] transition-colors">
            <span className="absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-[var(--color-fg)] peer-checked:translate-x-4 transition-transform" />
          </span>
          <div>
            <div className="text-sm font-medium">Stripe enabled</div>
            <div className="text-xs text-[var(--color-fg-muted)]">
              When off, the Buy button shows a coming-soon notice instead of
              starting a real checkout.
            </div>
          </div>
        </label>

        <div className="mt-4">
          <span className="block text-sm font-medium mb-2">Mode</span>
          <div className="inline-flex rounded-full border border-[var(--color-border)] p-1">
            {(["test", "live"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-colors ${
                  mode === m
                    ? m === "live"
                      ? "bg-red-500/15 text-red-300"
                      : "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                    : "text-[var(--color-fg-muted)]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-fg-muted)] mt-2">
            {mode === "test"
              ? "Use Stripe test cards (4242 4242 4242 4242) — no real money."
              : "Live mode charges real cards. Make sure your Stripe account is verified."}
          </p>
        </div>
      </Card>

      <Card title="API keys">
        <Field
          label="Publishable key"
          name="publishableKey"
          defaultValue={initial.publishableKey}
          placeholder={mode === "live" ? "pk_live_..." : "pk_test_..."}
          help="Public key, stored as-is."
        />
        <Field
          label="Secret key"
          name="secretKey"
          type="password"
          placeholder={
            initial.hasSecret
              ? "•••••• (saved — leave empty to keep)"
              : mode === "live"
                ? "sk_live_..."
                : "sk_test_..."
          }
          help="Encrypted with AUTH_SECRET before storage. Leave empty on save to keep the existing value."
        />
        <SecretStatus
          stored={initial.hasSecret}
          okLabel="Secret key stored"
          missingLabel="No secret key yet"
        />
      </Card>

      <Card title="Webhook">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 mb-4">
          <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-2">
            Endpoint URL
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-xs text-[var(--color-fg)] truncate">
              {webhookUrl}
            </code>
            <button
              type="button"
              onClick={copyWebhook}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors"
              title={copied ? "Copied" : "Copy"}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
          <p className="text-xs text-[var(--color-fg-muted)] mt-3">
            In the Stripe dashboard:{" "}
            <span className="text-[var(--color-fg)]">Developers → Webhooks → Add endpoint</span>.
            Paste the URL above and listen for{" "}
            <code className="font-mono text-[10px]">checkout.session.completed</code>.
          </p>
        </div>

        <Field
          label="Webhook signing secret"
          name="webhookSecret"
          type="password"
          placeholder={
            initial.hasWebhookSecret
              ? "•••••• (saved — leave empty to keep)"
              : "whsec_..."
          }
          help="Found in the webhook detail page. Encrypted before storage."
        />
        <SecretStatus
          stored={initial.hasWebhookSecret}
          okLabel="Webhook secret stored"
          missingLabel="No webhook secret yet"
        />
      </Card>

      <Card title="Redirects">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Success path"
            name="successPath"
            defaultValue={initial.successPath}
            placeholder="/store/checkout/success"
          />
          <Field
            label="Cancel path"
            name="cancelPath"
            defaultValue={initial.cancelPath}
            placeholder="/store"
          />
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 sticky bottom-6 bg-[var(--color-bg)]/80 backdrop-blur-sm py-4 px-2 rounded-2xl border border-[var(--color-border)]">
        {savedAt && (
          <span
            key={savedAt}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-accent)] mr-auto"
          >
            <Check size={12} />
            Saved
          </span>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Stripe settings"}
        </button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <header className="px-6 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-display text-base font-medium">{title}</h3>
      </header>
      <div className="p-6 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  help,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  help?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all font-mono text-sm"
      />
      {help && (
        <span className="block text-xs text-[var(--color-fg-muted)] mt-1.5">{help}</span>
      )}
    </label>
  );
}

function SecretStatus({
  stored,
  okLabel,
  missingLabel,
}: {
  stored: boolean;
  okLabel: string;
  missingLabel: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 text-[11px] font-medium ${
        stored ? "text-[var(--color-accent)]" : "text-orange-300"
      }`}
    >
      {stored ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
      {stored ? okLabel : missingLabel}
    </div>
  );
}
