"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  CheckSquare,
  X,
  Send,
} from "lucide-react";
import {
  markMessageRead,
  setMessageSaved,
  deleteMessage,
  markMessagesRead,
  deleteMessages,
  replyToThread,
} from "@/app/_actions/messages";
import { ConfirmDialog } from "./confirm-dialog";
import { getContactMeta } from "@/lib/contact-types";

type ContactDetail = {
  id: string;
  type: string;
  value: string;
  label: string;
};

export type ThreadMsg = {
  id: string;
  message: string;
  senderType: "customer" | "admin";
  read: boolean;
  saved: boolean;
  createdAt: string;
  name: string;
};

export type Thread = {
  threadKey: string;
  /** representative id (latest message) used for selection */
  id: string;
  name: string;
  email: string;
  lastMessage: string;
  lastSenderType: "customer" | "admin";
  lastCreatedAt: string;
  unreadCount: number;
  saved: boolean;
  contacts: ContactDetail[];
  messages: ThreadMsg[];
};

type View = "inbox" | "read" | "saved";

export function MessagesView({
  threads,
  view,
}: {
  threads: Thread[];
  view: View;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(
    threads[0]?.threadKey ?? null,
  );
  const [pendingDelete, setPendingDelete] = useState<Thread | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [bulkKeys, setBulkKeys] = useState<Set<string>>(new Set());
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [, startTransition] = useTransition();

  // Local thread overlay so admin replies appear instantly without a round-trip.
  const [localMessages, setLocalMessages] = useState<Record<string, ThreadMsg[]>>(
    {},
  );

  function exitSelect() {
    setSelectMode(false);
    setBulkKeys(new Set());
  }

  function toggleKey(key: string) {
    setBulkKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // sync selected when threads change
  useEffect(() => {
    if (threads.length === 0) {
      setSelectedKey(null);
      return;
    }
    if (!threads.find((t) => t.threadKey === selectedKey)) {
      setSelectedKey(threads[0].threadKey);
    }
  }, [threads, selectedKey]);

  // ── live SSE: instant updates without refresh ────────────────────────
  const router = useRouter();
  // Drop the local overlay whenever the server snapshot changes (after
  // router.refresh) — otherwise we'd double up on the same row.
  useEffect(() => {
    setLocalMessages({});
  }, [threads]);

  useEffect(() => {
    const es = new EventSource("/api/admin/notifications/stream");
    type SsePayload = {
      id: string;
      senderType: "customer" | "admin";
      message: string;
      createdAt: string;
      name: string;
    };
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as SsePayload;
        if (msg.senderType !== "customer") return;
        // Use the sender name to make a best-effort thread match. The
        // server-side stream doesn't expose threadKey directly to admin;
        // simplest robust path is to refresh, which gets us the canonical
        // grouping + unread counts.
        router.refresh();
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, [router]);

  const selected = useMemo(
    () => threads.find((t) => t.threadKey === selectedKey) ?? null,
    [threads, selectedKey],
  );

  if (threads.length === 0) {
    return <EmptyState view={view} />;
  }

  const showList = !selectedKey;
  const showConvo = !!selectedKey;

  const bulkIds = selected
    ? Array.from(bulkKeys).flatMap((key) => {
        const t = threads.find((x) => x.threadKey === key);
        return t ? t.messages.map((m) => m.id) : [];
      })
    : [];

  const selectedMessages: ThreadMsg[] = selected
    ? [...selected.messages, ...(localMessages[selected.threadKey] ?? [])]
    : [];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 min-h-[60vh]">
        <aside
          className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden ${
            showList ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/40">
            {selectMode ? (
              <>
                <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
                  {bulkKeys.size} selected
                </span>
                <button
                  type="button"
                  onClick={exitSelect}
                  className="text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] inline-flex items-center gap-1.5"
                >
                  <X size={12} />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
                  {threads.length} conversation{threads.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className="text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] inline-flex items-center gap-1.5"
                >
                  <CheckSquare size={12} />
                  Select
                </button>
              </>
            )}
          </div>
          <ul className="divide-y divide-[var(--color-border)] max-h-[70vh] overflow-y-auto">
            {threads.map((t) => (
              <ListItem
                key={t.threadKey}
                thread={t}
                active={t.threadKey === selectedKey}
                selectMode={selectMode}
                checked={bulkKeys.has(t.threadKey)}
                onClick={() => {
                  if (selectMode) toggleKey(t.threadKey);
                  else setSelectedKey(t.threadKey);
                }}
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
                key={selected.threadKey}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col h-full"
              >
                <ConversationHeader
                  thread={selected}
                  onBack={() => setSelectedKey(null)}
                  onSavedToggle={() =>
                    startTransition(() =>
                      setMessageSaved(selected.id, !selected.saved),
                    )
                  }
                  onToggleRead={() =>
                    startTransition(async () => {
                      // Mark all unread customer messages in the thread as read
                      const unreadIds = selected.messages
                        .filter((m) => m.senderType === "customer" && !m.read)
                        .map((m) => m.id);
                      if (selected.unreadCount > 0 && unreadIds.length > 0) {
                        await markMessagesRead(unreadIds, true);
                      } else {
                        await markMessageRead(selected.id, false);
                      }
                    })
                  }
                  onDelete={() => setPendingDelete(selected)}
                />
                <ConversationBody
                  thread={selected}
                  messages={selectedMessages}
                />
                <ReplyComposer
                  threadKey={selected.threadKey}
                  onSent={(msg) => {
                    setLocalMessages((prev) => {
                      const list = prev[selected.threadKey] ?? [];
                      return {
                        ...prev,
                        [selected.threadKey]: [...list, msg],
                      };
                    });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {selectMode && bulkKeys.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 backdrop-blur-md px-3 py-2 shadow-2xl">
            <span className="px-3 text-[12px] text-[var(--color-fg-muted)] tabular-nums">
              {bulkKeys.size} selected
            </span>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await markMessagesRead(bulkIds, true);
                  exitSelect();
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <CheckCheck size={13} />
              Mark read
            </button>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await markMessagesRead(bulkIds, false);
                  exitSelect();
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <Mail size={13} />
              Mark unread
            </button>
            <button
              type="button"
              onClick={() => setPendingBulkDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={13} />
              Delete
            </button>
            <button
              type="button"
              onClick={exitSelect}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <X size={13} />
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete conversation"
        description={
          pendingDelete
            ? `Delete the entire conversation with "${pendingDelete.name}"? All ${pendingDelete.messages.length} message${pendingDelete.messages.length === 1 ? "" : "s"} will be removed.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteMessages(pendingDelete.messages.map((m) => m.id));
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={pendingBulkDelete}
        title="Delete conversations"
        description={`Delete ${bulkKeys.size} selected conversation${bulkKeys.size === 1 ? "" : "s"}? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingBulkDelete(false)}
        onConfirm={async () => {
          await deleteMessages(bulkIds);
          setPendingBulkDelete(false);
          exitSelect();
        }}
      />
    </>
  );
}

function ListItem({
  thread,
  active,
  selectMode,
  checked,
  onClick,
}: {
  thread: Thread;
  active: boolean;
  selectMode: boolean;
  checked: boolean;
  onClick: () => void;
}) {
  const initial = thread.name.trim()[0]?.toUpperCase() ?? "?";
  const time = formatRelative(thread.lastCreatedAt);
  const preview =
    thread.lastSenderType === "admin"
      ? `You: ${thread.lastMessage}`
      : thread.lastMessage;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left px-4 py-4 flex gap-3 items-start transition-colors ${
          selectMode
            ? checked
              ? "bg-[var(--color-accent)]/8 border-l-2 border-l-[var(--color-accent)]"
              : "hover:bg-[var(--color-surface-2)] border-l-2 border-l-transparent"
            : active
              ? "bg-[var(--color-surface-2)] border-l-2 border-l-[var(--color-accent)]"
              : "hover:bg-[var(--color-surface-2)] border-l-2 border-l-transparent"
        }`}
      >
        {selectMode && (
          <span
            className={`mt-1 flex h-4 w-4 items-center justify-center rounded border flex-shrink-0 transition-colors ${
              checked
                ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-bg)]"
                : "border-[var(--color-border)] bg-[var(--color-bg)]"
            }`}
            aria-hidden
          >
            {checked && <Check size={11} strokeWidth={3} />}
          </span>
        )}
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-sm font-medium flex-shrink-0">
          {initial}
          {thread.unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-surface)]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span
              className={`truncate text-sm ${thread.unreadCount > 0 ? "font-semibold" : ""}`}
            >
              {thread.name}
            </span>
            <span className="text-[10px] text-[var(--color-fg-dim)] tabular-nums flex-shrink-0">
              {time}
            </span>
          </div>
          <p className="text-xs text-[var(--color-fg-muted)] line-clamp-2 leading-snug">
            {preview}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {thread.saved && (
              <Star
                size={11}
                className="text-[var(--color-accent)]"
                fill="currentColor"
              />
            )}
            {thread.messages.length > 1 && (
              <span className="text-[10px] text-[var(--color-fg-dim)]">
                {thread.messages.length} messages
              </span>
            )}
            {thread.contacts.slice(0, 4).map((c) => {
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
            {thread.contacts.length > 4 && (
              <span className="text-[10px] text-[var(--color-fg-dim)]">
                +{thread.contacts.length - 4}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function ConversationHeader({
  thread,
  onBack,
  onSavedToggle,
  onToggleRead,
  onDelete,
}: {
  thread: Thread;
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
          {thread.name.trim()[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-medium truncate">{thread.name}</h2>
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-muted)] mt-0.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={11} />
              {formatFull(thread.lastCreatedAt)}
            </span>
            {thread.contacts.length > 0 && (
              <>
                <span className="text-[var(--color-fg-dim)]">·</span>
                <ContactPills contacts={thread.contacts} />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <IconButton
          tip={thread.saved ? "Saved" : "Save"}
          onClick={onSavedToggle}
          active={thread.saved}
          activeClass="text-[var(--color-accent)]"
        >
          <Star
            size={14}
            fill={thread.saved ? "currentColor" : "transparent"}
          />
        </IconButton>
        <IconButton
          tip={thread.unreadCount === 0 ? "Mark unread" : "Mark read"}
          onClick={onToggleRead}
          active={thread.unreadCount === 0}
        >
          {thread.unreadCount === 0 ? <Mail size={14} /> : <CheckCheck size={14} />}
        </IconButton>
        <IconButton tip="Delete" onClick={onDelete} hoverClass="text-red-400 hover:bg-red-500/10">
          <Trash2 size={14} />
        </IconButton>
      </div>
    </header>
  );
}

function ConversationBody({
  thread,
  messages,
}: {
  thread: Thread;
  messages: ThreadMsg[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-y-auto"
    >
      {messages.map((m) => (
        <MessageBubble key={m.id} msg={m} senderName={thread.name} />
      ))}
    </div>
  );
}

function ContactPills({
  contacts,
}: {
  contacts: { id: string; type: string; value: string; label: string }[];
}) {
  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      {contacts.map((c) => {
        const meta = getContactMeta(c.type);
        const Icon = meta.icon;
        const href = meta.href ? meta.href(c.value) : undefined;
        const display =
          meta.prefix && !c.value.startsWith(meta.prefix)
            ? `${meta.prefix}${c.value}`
            : c.value;
        const title = `${c.type === "other" && c.label ? c.label : meta.label}: ${display}`;
        const className =
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors text-[10px] max-w-[180px]";
        const inner = (
          <>
            <Icon size={10} />
            <span className="truncate">{c.value}</span>
          </>
        );
        return href ? (
          <a
            key={c.id}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            title={title}
            className={className}
          >
            {inner}
          </a>
        ) : (
          <span key={c.id} title={title} className={className}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}

function MessageBubble({
  msg,
  senderName,
}: {
  msg: ThreadMsg;
  senderName: string;
}) {
  if (msg.senderType === "admin") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          <div className="rounded-2xl rounded-tr-sm bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/35 text-[var(--color-fg)] px-4 py-3">
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
              {msg.message}
            </p>
          </div>
          <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-[var(--color-fg-dim)]">
            <span>You</span>
            <span>·</span>
            <span>{formatRelative(msg.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }
  const initial = senderName.trim()[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-xs font-medium flex-shrink-0">
        {initial}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-medium">{senderName}</span>
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
  );
}

function ReplyComposer({
  threadKey,
  onSent,
}: {
  threadKey: string;
  onSent: (msg: ThreadMsg) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const res = await replyToThread(threadKey, trimmed);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSent({
        id: res.id,
        message: trimmed,
        senderType: "admin",
        read: true,
        saved: false,
        createdAt: res.createdAt,
        name: "You",
      });
      setText("");
    });
  }

  return (
    <form
      onSubmit={submit}
      className="border-t border-[var(--color-border)] p-3 md:p-4 bg-[var(--color-surface-2)]/30"
    >
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply…"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
            }
          }}
          className="flex-1 px-3 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] text-[14px] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none transition-colors resize-y leading-relaxed"
        />
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-[13px] hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            "Sending…"
          ) : (
            <>
              <Send size={13} />
              Send reply
            </>
          )}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-[11px] text-red-400">{error}</div>
      )}
    </form>
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
      subtitle: "Conversations you've read without saving end up here.",
      icon: <Check size={24} />,
    },
    saved: {
      title: "No saved messages",
      subtitle: "Star important conversations to find them quickly here.",
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
