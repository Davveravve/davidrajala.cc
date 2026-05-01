"use client";

import { useState, useTransition } from "react";
import { Send, Check, AlertCircle, ExternalLink, Bot } from "lucide-react";
import { updateNotifications, sendTestTelegramMessage } from "@/app/_actions/notifications";

type Props = {
  initial: {
    telegramEnabled: boolean;
    telegramToken: string;
    telegramChatId: string;
  };
};

export function NotificationsForm({ initial }: Props) {
  const [enabled, setEnabled] = useState(initial.telegramEnabled);
  const [token, setToken] = useState(initial.telegramToken);
  const [chatId, setChatId] = useState(initial.telegramChatId);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [testStatus, setTestStatus] = useState<"idle" | "ok" | "error">("idle");
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("telegramEnabled", enabled ? "on" : "");
    startTransition(async () => {
      await updateNotifications(fd);
      setSavedAt(Date.now());
    });
  }

  function runTest() {
    setTestStatus("idle");
    setTestMessage(null);
    startTransition(async () => {
      const res = await sendTestTelegramMessage();
      if (res.ok) {
        setTestStatus("ok");
        setTestMessage("Sent! Check your Telegram app.");
      } else {
        setTestStatus("error");
        setTestMessage(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <Card title="Telegram">
        <div className="flex items-start gap-4 mb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex-shrink-0">
            <Bot size={18} />
          </span>
          <div className="flex-1">
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed mb-3">
              Get a Telegram notification as soon as someone sends a message via the chat on your site.
            </p>
            <ol className="text-xs text-[var(--color-fg-muted)] space-y-1.5 list-decimal pl-4 leading-relaxed">
              <li>
                Message{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] inline-flex items-center gap-1 hover:underline"
                >
                  @BotFather <ExternalLink size={10} />
                </a>{" "}
                and run <span className="font-mono text-[var(--color-fg)]">/newbot</span> — copy the bot token.
              </li>
              <li>
                Start your new bot (click on it and press Start), send <span className="font-mono text-[var(--color-fg)]">/start</span>.
              </li>
              <li>
                Message{" "}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] inline-flex items-center gap-1 hover:underline"
                >
                  @userinfobot <ExternalLink size={10} />
                </a>{" "}
                — copy your <span className="font-mono text-[var(--color-fg)]">Id</span>.
              </li>
              <li>Paste below, toggle on, and press Save — then test with &quot;Send test&quot;.</li>
            </ol>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-5 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
          <div>
            <div className="text-sm font-medium">Enable Telegram notifications</div>
            <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
              Forwards new chat messages to your Telegram
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 rounded-full transition-colors px-0.5 ${
              enabled ? "bg-[var(--color-accent)]" : "bg-[var(--color-surface-2)]"
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="space-y-4">
          <Field
            label="Bot token"
            name="telegramToken"
            value={token}
            onChange={setToken}
            placeholder="123456789:AAExxxxxxxx..."
            mono
          />
          <Field
            label="Chat ID"
            name="telegramChatId"
            value={chatId}
            onChange={setChatId}
            placeholder="123456789"
            mono
          />
        </div>

        {testMessage && (
          <div
            className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              testStatus === "ok"
                ? "border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-[var(--color-accent)]"
                : "border border-red-500/30 bg-red-500/5 text-red-400"
            }`}
          >
            {testStatus === "ok" ? <Check size={14} /> : <AlertCircle size={14} />}
            {testMessage}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runTest}
            disabled={!token || !chatId || isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            Send test
          </button>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3 sticky bottom-6 bg-[var(--color-bg)]/80 backdrop-blur-sm py-4 px-2 rounded-2xl border border-[var(--color-border)]">
        {savedAt && (
          <span
            key={savedAt}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--color-accent)] mr-auto"
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
          Save changes
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
      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={`w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] text-[14px] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none transition-colors ${
          mono ? "font-mono" : ""
        }`}
      />
    </label>
  );
}
