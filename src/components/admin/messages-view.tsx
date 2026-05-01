"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Trash2,
  Star,
  Clock,
  Check,
  CheckCheck,
  ArrowUpRight,
  Inbox,
  ArrowLeft,
  Copy,
} from "lucide-react";
import {
  markMessageRead,
  setMessageSaved,
  deleteMessage,
} from "@/app/_actions/messages";
import { TwoFactorPrompt } from "./two-factor-prompt";
import { getContactMeta } from "@/lib/contact-types";

type ContactDetail = {
  id: string;
  type: string;
  value: string;
  label: string;
};

type Msg = {
  id: string;
  name: string;
  message: string;
  read: boolean;
  saved: boolean;
  createdAt: string;
  contacts: ContactDetail[];
};

type View = "inbox" | "read" | "saved";

export function MessagesView({
  messages,
  view,
}: {
  messages: Msg[];
  view: View;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    messages[0]?.id ?? null,
  );
  const [pendingDelete, setPendingDelete] = useState<Msg | null>(null);
  const [, startTransition] = useTransition();

  // sync selected when messages change
  useEffect(() => {
    if (messages.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!messages.find((m) => m.id === selectedId)) {
      setSelectedId(messages[0].id);
    }
  }, [messages, selectedId]);

  const selected = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? null,
    [messages, selectedId],
  );

  if (messages.length === 0) {
    return (
      <EmptyState view={view} />
    );
  }

  const showList = !selectedId;
  const showConvo = !!selectedId;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 min-h-[60vh]">
        <aside
          className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden ${
            showList ? "block" : "hidden lg:block"
          }`}
        >
          <ul className="divide-y divide-[var(--color-border)] max-h-[70vh] overflow-y-auto">
            {messages.map((m) => (
              <ListItem
                key={m.id}
                msg={m}
                active={m.id === selectedId}
                onClick={() => setSelectedId(m.id)}
              />
            ))}
          </ul>
        </aside>

        <section
          className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden ${
            showConvo ? "block" : "hidden lg:block"
          }`}
        >
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col h-full"
              >
                <ConversationHeader
                  msg={selected}
                  onBack={() => setSelectedId(null)}
                  onSavedToggle={() =>
                    startTransition(() =>
                      setMessageSaved(selected.id, !selected.saved),
                    )
                  }
                  onToggleRead={() =>
                    startTransition(() => markMessageRead(selected.id, !selected.read))
                  }
                  onDelete={() => setPendingDelete(selected)}
                />
                <ConversationBody msg={selected} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <TwoFactorPrompt
        open={pendingDelete !== null}
        title="Delete message"
        description={
          pendingDelete
            ? `Delete the message from "${pendingDelete.name}"?`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onSubmit={async (verification) => {
          if (!pendingDelete) return;
          await deleteMessage(pendingDelete.id, verification);
          setPendingDelete(null);
        }}
      />
    </>
  );
}

function ListItem({
  msg,
  active,
  onClick,
}: {
  msg: Msg;
  active: boolean;
  onClick: () => void;
}) {
  const initial = msg.name.trim()[0]?.toUpperCase() ?? "?";
  const time = formatRelative(msg.createdAt);

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left px-4 py-4 flex gap-3 items-start transition-colors ${
          active
            ? "bg-[var(--color-surface-2)] border-l-2 border-l-[var(--color-accent)]"
            : "hover:bg-[var(--color-surface-2)] border-l-2 border-l-transparent"
        }`}
      >
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-sm font-medium flex-shrink-0">
          {initial}
          {!msg.read && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-surface)]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`truncate text-sm ${msg.read ? "" : "font-semibold"}`}>
              {msg.name}
            </span>
            <span className="text-[10px] text-[var(--color-fg-dim)] tabular-nums flex-shrink-0">
              {time}
            </span>
          </div>
          <p className="text-xs text-[var(--color-fg-muted)] line-clamp-2 leading-snug">
            {msg.message}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {msg.saved && (
              <Star
                size={11}
                className="text-[var(--color-accent)]"
                fill="currentColor"
              />
            )}
            {msg.contacts.slice(0, 4).map((c) => {
              const meta = getContactMeta(c.type);
              const Icon = meta.icon;
              return (
                <span
                  key={c.id}
                  className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-fg-dim)]"
                  title={meta.label}
                >
                  <Icon size={11} />
                </span>
              );
            })}
            {msg.contacts.length > 4 && (
              <span className="text-[10px] text-[var(--color-fg-dim)]">
                +{msg.contacts.length - 4}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function ConversationHeader({
  msg,
  onBack,
  onSavedToggle,
  onToggleRead,
  onDelete,
}: {
  msg: Msg;
  onBack: () => void;
  onSavedToggle: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
}) {
  return (
    <header className="px-4 md:px-6 py-4 md:py-5 border-b border-[var(--color-border)] flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] font-medium flex-shrink-0">
          {msg.name.trim()[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-medium truncate">{msg.name}</h2>
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-muted)] mt-0.5">
            <Clock size={11} />
            <span>{formatFull(msg.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <IconButton
          tip={msg.saved ? "Saved" : "Save"}
          onClick={onSavedToggle}
          active={msg.saved}
          activeClass="text-[var(--color-accent)]"
        >
          <Star
            size={14}
            fill={msg.saved ? "currentColor" : "transparent"}
          />
        </IconButton>
        <IconButton
          tip={msg.read ? "Mark unread" : "Mark read"}
          onClick={onToggleRead}
          active={msg.read}
        >
          {msg.read ? <Mail size={14} /> : <CheckCheck size={14} />}
        </IconButton>
        <IconButton tip="Delete" onClick={onDelete} hoverClass="text-red-400 hover:bg-red-500/10">
          <Trash2 size={14} />
        </IconButton>
      </div>
    </header>
  );
}

function ConversationBody({ msg }: { msg: Msg }) {
  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 gap-6 overflow-y-auto">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-xs font-medium flex-shrink-0">
          {msg.name.trim()[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-medium">{msg.name}</span>
            <span className="text-[10px] text-[var(--color-fg-dim)]">
              {formatRelative(msg.createdAt)}
            </span>
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-3 max-w-2xl">
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-[var(--color-fg)]">
              {msg.message}
            </p>
          </div>
        </div>
      </div>

      {msg.contacts.length > 0 && (
        <div className="border-t border-[var(--color-border)] pt-5">
          <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-3 flex items-center gap-3">
            <span className="h-px w-6 bg-[var(--color-fg-dim)]" />
            Contact details
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {msg.contacts.map((c) => (
              <ContactCard key={c.id} contact={c} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ContactCard({ contact }: { contact: ContactDetail }) {
  const meta = getContactMeta(contact.type);
  const Icon = meta.icon;
  const href = meta.href ? meta.href(contact.value) : undefined;
  const displayLabel = contact.type === "other" ? contact.label || meta.label : meta.label;
  const displayValue =
    meta.prefix && !contact.value.startsWith(meta.prefix)
      ? `${meta.prefix}${contact.value}`
      : contact.value;

  return (
    <li>
      <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)] transition-colors">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-accent)] flex-shrink-0">
          <Icon size={14} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
            {displayLabel}
          </div>
          <div className="text-sm font-medium truncate">{displayValue}</div>
        </div>
        <CopyButton value={contact.value} />
        {href && (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors flex-shrink-0"
            title="Open"
          >
            <ArrowUpRight size={13} />
          </a>
        )}
      </div>
    </li>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
        copied
          ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10"
          : "text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
      }`}
      title={copied ? "Copied" : "Copy"}
      aria-label="Copy"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function IconButton({
  tip,
  onClick,
  children,
  active,
  activeClass,
  hoverClass,
}: {
  tip: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  activeClass?: string;
  hoverClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tip}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
        active
          ? activeClass ?? "text-[var(--color-accent)]"
          : `text-[var(--color-fg-muted)] ${hoverClass ?? "hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]"}`
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ view }: { view: View }) {
  const messages: Record<View, { title: string; subtitle: string; icon: React.ReactNode }> = {
    inbox: {
      title: "Inbox is empty",
      subtitle: "New messages from the chat on your site will show up here.",
      icon: <Inbox size={24} />,
    },
    read: {
      title: "No read messages",
      subtitle: "Messages you've read without saving end up here.",
      icon: <Check size={24} />,
    },
    saved: {
      title: "No saved messages",
      subtitle: "Star important messages to find them quickly here.",
      icon: <Star size={24} />,
    },
  };
  const m = messages[view];
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] mb-4">
        {m.icon}
      </div>
      <div className="font-display text-xl mb-1">{m.title}</div>
      <p className="text-sm text-[var(--color-fg-muted)] max-w-sm mx-auto">{m.subtitle}</p>
    </div>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

