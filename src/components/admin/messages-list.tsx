"use client";

import { useState, useTransition } from "react";
import { Mail, MailOpen, Trash2, Reply } from "lucide-react";
import { markMessageRead, deleteMessage } from "@/app/_actions/messages";
import { TwoFactorPrompt } from "./two-factor-prompt";

type Msg = {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function MessagesList({ messages }: { messages: Msg[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function toggleOpen(m: Msg) {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next && !m.read) {
      startTransition(() => markMessageRead(m.id, true));
    }
  }

  function onDelete(id: string) {
    setPendingDelete(id);
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
        <Mail size={32} className="mx-auto mb-4 text-[var(--color-fg-muted)]" />
        <div className="font-display text-xl mb-1">Inga meddelanden</div>
        <p className="text-sm text-[var(--color-fg-muted)]">
          Meddelanden via kontaktformuläret hamnar här.
        </p>
      </div>
    );
  }

  return (
    <>
    <TwoFactorPrompt
      open={pendingDelete !== null}
      title="Radera meddelande"
      description="Bekräfta radering med din 2FA-kod."
      confirmLabel="Radera"
      destructive
      onCancel={() => setPendingDelete(null)}
      onSubmit={async (code) => {
        if (!pendingDelete) return;
        await deleteMessage(pendingDelete, code);
        setPendingDelete(null);
      }}
    />
    <ul className="space-y-2">
      {messages.map((m) => {
        const isOpen = openId === m.id;
        return (
          <li
            key={m.id}
            className={`rounded-xl border bg-[var(--color-surface)] transition-all ${
              isOpen
                ? "border-[var(--color-accent)]"
                : m.read
                  ? "border-[var(--color-border)]"
                  : "border-[var(--color-border-strong)]"
            }`}
          >
            <button
              onClick={() => toggleOpen(m)}
              className="w-full flex items-center gap-4 p-4 text-left"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  m.read ? "bg-[var(--color-surface-2)]" : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                }`}
              >
                {m.read ? <MailOpen size={14} /> : <Mail size={14} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`${m.read ? "" : "font-semibold"}`}>{m.name}</span>
                  <span className="text-xs text-[var(--color-fg-muted)]">·</span>
                  <span className="text-xs text-[var(--color-fg-muted)] truncate">{m.email}</span>
                </div>
                <p className="text-sm text-[var(--color-fg-muted)] truncate mt-0.5">{m.message}</p>
              </div>
              <span className="font-mono text-[10px] text-[var(--color-fg-dim)] flex-shrink-0">
                {new Date(m.createdAt).toLocaleDateString("sv-SE")}
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4">
                <div className="rounded-lg bg-[var(--color-bg)] p-4 border border-[var(--color-border)] mb-3">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`mailto:${m.email}?subject=Re: Ditt meddelande&body=Hej ${m.name},%0A%0A`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow"
                  >
                    <Reply size={14} />
                    Svara
                  </a>
                  {m.read && (
                    <button
                      onClick={() => startTransition(() => markMessageRead(m.id, false))}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:border-[var(--color-border-strong)] transition-colors"
                    >
                      <Mail size={14} />
                      Markera oläst
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(m.id)}
                    className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    Radera
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
    </>
  );
}
