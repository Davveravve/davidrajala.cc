"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Send,
  Check,
  AlertCircle,
  Cookie,
  Settings,
  Trash2,
  Pencil,
} from "lucide-react";
import { useChat } from "./chat-context";
import { sendChatMessage } from "@/app/_actions/contact";
import {
  CONTACT_TYPES,
  getContactMeta,
  type ContactTypeKey,
  type ContactTypeMeta,
} from "@/lib/contact-types";
import {
  loadConsent,
  saveConsent,
  loadProfile,
  saveProfile,
  loadHistory,
  appendHistory,
  clearAll as clearAllStorage,
  type Consent,
  type StoredContact,
  type StoredMessage,
} from "@/lib/chat-storage";

type AddedContact = {
  uid: string;
  type: ContactTypeKey;
  value: string;
  label?: string;
};

const ORDER: ContactTypeKey[] = [
  "mail",
  "phone",
  "instagram",
  "snapchat",
  "linkedin",
  "x",
  "discord",
  "other",
];

let nextUid = 1;
const newUid = () => `c-${nextUid++}-${Date.now().toString(36)}`;

export function ChatPanel({
  avatarUrl,
  ownerName,
  available,
}: {
  avatarUrl: string;
  ownerName: string;
  available: boolean;
}) {
  const { open, setOpen } = useChat();
  const [consent, setConsentState] = useState<Consent>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<AddedContact[]>([]);
  const [history, setHistory] = useState<StoredMessage[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [profileLocked, setProfileLocked] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  // hydrate from storage when opening
  useEffect(() => {
    if (!open) return;
    const c = loadConsent();
    setConsentState(c);
    if (c === "yes") {
      const p = loadProfile();
      if (p) {
        setName(p.name);
        setContacts(
          p.contacts.map((sc) => ({
            uid: newUid(),
            type: (sc.type as ContactTypeKey) || "other",
            value: sc.value,
            label: sc.label,
          })),
        );
        setProfileLocked(true);
      }
      setHistory(loadHistory());
    } else {
      setHistory([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setTimeout(() => messageRef.current?.focus(), 250);
    }
  }, [open]);

  // scroll conversation to bottom when new history arrives
  useEffect(() => {
    if (!open) return;
    const el = conversationRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history.length, open]);

  function close() {
    setOpen(false);
  }

  function addContact(type: ContactTypeKey) {
    setContacts((prev) => [...prev, { uid: newUid(), type, value: "" }]);
    setPickerOpen(false);
  }

  function removeContact(uid: string) {
    setContacts((prev) => prev.filter((c) => c.uid !== uid));
  }

  function updateContact(uid: string, value: string, label?: string) {
    setContacts((prev) =>
      prev.map((c) => (c.uid === uid ? { ...c, value, label } : c)),
    );
  }

  function unlockProfile() {
    setProfileLocked(false);
  }

  function lockProfile() {
    if (consent === "yes" && name.trim()) {
      const validContacts = contacts.filter((c) => c.value.trim().length > 0);
      saveProfile({
        name: name.trim(),
        contacts: validContacts.map((c) => ({
          type: c.type,
          value: c.value.trim(),
          label: c.label,
        })),
      });
    }
    setProfileLocked(true);
  }

  function handleConsent(value: "yes" | "no") {
    saveConsent(value);
    setConsentState(value);
  }

  function clearAllData() {
    clearAllStorage();
    setConsentState(null);
    setName("");
    setContacts([]);
    setHistory([]);
    setProfileLocked(false);
    setSettingsOpen(false);
  }

  const usedTypes = new Set(contacts.map((c) => c.type));
  const availableTypes: ContactTypeMeta[] = ORDER.filter(
    (k) => k === "other" || !usedTypes.has(k),
  ).map((k) => CONTACT_TYPES[k]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    if (message.trim().length < 5) {
      setError("Message is too short");
      return;
    }
    const validContacts = contacts.filter((c) => c.value.trim().length > 0);
    if (validContacts.length === 0) {
      setError("Add at least one way to reach you");
      return;
    }

    const payloadContacts: StoredContact[] = validContacts.map((c) => ({
      type: c.type,
      value: c.value.trim(),
      label: c.label,
    }));

    startTransition(async () => {
      const res = await sendChatMessage({
        name: name.trim(),
        message: message.trim(),
        contacts: payloadContacts,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }

      // local history + profile (only if consent given)
      if (consent === "yes") {
        const stored: StoredMessage = {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          message: message.trim(),
          contacts: payloadContacts,
          createdAt: new Date().toISOString(),
        };
        appendHistory(stored);
        saveProfile({ name: name.trim(), contacts: payloadContacts });
        setHistory((prev) => [...prev, stored]);
        setProfileLocked(true);
      }

      setMessage("");
      setJustSent(true);
      setTimeout(() => setJustSent(false), 2200);
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150]"
        >
          <div
            className="absolute inset-0 bg-black/80"
            onClick={close}
            aria-hidden
          />

          <motion.aside
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 right-0 bottom-0 w-full sm:w-[460px] flex flex-col bg-[var(--color-bg-elevated)] border-l border-[var(--color-border)] shadow-2xl"
            role="dialog"
            aria-label="Send message"
          >
            <header className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  url={avatarUrl}
                  alt={ownerName}
                  available={available}
                  size={40}
                />
                <div>
                  <div className="font-medium text-sm">{ownerName}</div>
                  <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)]">
                    {available ? "Available now" : "Busy"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {consent === "yes" && (
                  <button
                    type="button"
                    onClick={() => setSettingsOpen((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors"
                    aria-label="Settings"
                    title="Settings"
                  >
                    <Settings size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={close}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-[var(--color-border)]"
                >
                  <div className="px-6 py-4 bg-[var(--color-surface)]/40 flex items-center justify-between gap-4">
                    <div className="text-xs text-[var(--color-fg-muted)] leading-relaxed">
                      Your details and messages are saved on this device.
                    </div>
                    <button
                      type="button"
                      onClick={clearAllData}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={12} />
                      Forget me
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              ref={conversationRef}
              className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
            >
              <WelcomeBubble ownerName={ownerName} avatarUrl={avatarUrl} />

              <AnimatePresence initial={false}>
                {history.map((m) => (
                  <UserBubble
                    key={m.id}
                    message={m.message}
                    createdAt={m.createdAt}
                    contacts={m.contacts}
                  />
                ))}
              </AnimatePresence>

              {justSent && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 justify-center text-[11px] text-[var(--color-accent)] font-medium pt-2"
                >
                  <Check size={12} />
                  Sent — I&apos;ll get back to you soon
                </motion.div>
              )}
            </div>

            <form
              onSubmit={submit}
              className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
            >
              {consent === null && (
                <ConsentBanner onAccept={() => handleConsent("yes")} onDecline={() => handleConsent("no")} />
              )}

              {profileLocked && consent === "yes" ? (
                <ProfileSummary
                  name={name}
                  contacts={contacts}
                  onEdit={unlockProfile}
                />
              ) : (
                <div className="px-6 pt-4 space-y-3">
                  {consent === "yes" && (
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)]">
                        Your details
                      </span>
                      <button
                        type="button"
                        onClick={lockProfile}
                        disabled={!name.trim() || contacts.filter(c => c.value.trim()).length === 0}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Check size={11} /> Done
                      </button>
                    </div>
                  )}
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] text-[14px] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                  />

                  {contacts.length > 0 && (
                    <div className="space-y-2">
                      {contacts.map((c) => (
                        <ContactRow
                          key={c.uid}
                          contact={c}
                          onChange={(value, label) =>
                            updateContact(c.uid, value, label)
                          }
                          onRemove={() => removeContact(c.uid)}
                        />
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPickerOpen((v) => !v)}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors text-xs"
                    >
                      <Plus size={12} />
                      Add contact
                    </button>

                    <AnimatePresence>
                      {pickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full mb-2 left-0 right-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-2xl overflow-hidden z-10"
                        >
                          <div className="p-1.5 grid grid-cols-2 gap-1">
                            {availableTypes.map((t) => {
                              const Icon = t.icon;
                              return (
                                <button
                                  key={t.key}
                                  type="button"
                                  onClick={() => addContact(t.key)}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition-colors"
                                >
                                  <Icon size={12} />
                                  {t.label}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              <div className="px-6 pt-3 pb-4 space-y-3">
                <textarea
                  ref={messageRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a message…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] text-[14px] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none transition-colors resize-y leading-relaxed"
                />

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
                    <AlertCircle size={12} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-[14px] hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    "Sending…"
                  ) : (
                    <>
                      <Send
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                      Send
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Avatar({
  url,
  alt,
  available,
  size,
}: {
  url: string;
  alt: string;
  available: boolean;
  size: number;
}) {
  return (
    <div className="relative flex-shrink-0" style={{ height: size, width: size }}>
      <div className="h-full w-full rounded-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
        {url && (
          <Image src={url} alt={alt} fill sizes={`${size}px`} className="object-cover" />
        )}
      </div>
      <span
        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--color-bg-elevated)] z-10"
        style={{
          background: available ? "var(--color-accent)" : "rgb(249 115 22)",
          boxShadow: available
            ? "0 0 8px var(--color-accent)"
            : "0 0 8px rgb(249 115 22 / 0.6)",
        }}
      />
    </div>
  );
}

function WelcomeBubble({
  ownerName,
  avatarUrl,
}: {
  ownerName: string;
  avatarUrl: string;
}) {
  const first = ownerName.split(" ")[0] ?? ownerName;
  return (
    <div className="flex items-start gap-3">
      <div className="relative h-9 w-9 rounded-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
        {avatarUrl && (
          <Image src={avatarUrl} alt="" fill sizes="36px" className="object-cover" />
        )}
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 max-w-[85%]">
        <p className="text-[14px] leading-relaxed">
          Hi, I&apos;m {first}. Send me a message and I&apos;ll get back to you as soon as I can.
        </p>
      </div>
    </div>
  );
}

function UserBubble({
  message,
  createdAt,
  contacts,
}: {
  message: string;
  createdAt: string;
  contacts: StoredContact[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-end"
    >
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-tr-sm bg-[var(--color-accent)] text-[var(--color-bg)] px-4 py-3 shadow-[0_0_24px_rgba(var(--color-accent-rgb),0.18)]">
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        <div className="mt-1.5 flex items-center justify-end gap-2 text-[10px] text-[var(--color-fg-dim)]">
          {contacts.slice(0, 3).map((c, i) => {
            const meta = getContactMeta(c.type);
            const Icon = meta.icon;
            return (
              <span key={i} className="inline-flex items-center gap-1">
                <Icon size={10} />
              </span>
            );
          })}
          <Check size={10} className="text-[var(--color-accent)]" />
          <span>{formatTime(createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ConsentBanner({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="px-6 pt-4 pb-1">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex-shrink-0">
            <Cookie size={13} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] leading-relaxed text-[var(--color-fg-muted)]">
              Want me to save your details and previous messages on{" "}
              <span className="text-[var(--color-fg)]">this device</span>? That
              way you won&apos;t have to retype them next time.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={onAccept}
                className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-medium hover:shadow-[0_0_20px_var(--color-accent-glow)] transition-shadow"
              >
                Yes, save
              </button>
              <button
                type="button"
                onClick={onDecline}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs hover:border-[var(--color-border-strong)] transition-colors"
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSummary({
  name,
  contacts,
  onEdit,
}: {
  name: string;
  contacts: AddedContact[];
  onEdit: () => void;
}) {
  return (
    <div className="px-6 pt-4">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-3 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium flex-shrink-0">
          {name.trim()[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate">{name}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {contacts.map((c) => {
              const meta = getContactMeta(c.type);
              const Icon = meta.icon;
              return (
                <span
                  key={c.uid}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[10px] text-[var(--color-fg-muted)]"
                  title={c.value}
                >
                  <Icon size={10} />
                </span>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg)] transition-colors flex-shrink-0"
          title="Edit"
        >
          <Pencil size={12} />
        </button>
      </div>
    </div>
  );
}

function ContactRow({
  contact,
  onChange,
  onRemove,
}: {
  contact: AddedContact;
  onChange: (value: string, label?: string) => void;
  onRemove: () => void;
}) {
  const meta = CONTACT_TYPES[contact.type];
  const Icon = meta.icon;
  const isOther = contact.type === "other";

  return (
    <div className="group flex items-center gap-2 px-2 pl-2.5 py-1.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] focus-within:border-[var(--color-accent)] transition-colors">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-surface)] text-[var(--color-accent)] flex-shrink-0">
        <Icon size={12} />
      </span>
      <div className="flex-1 min-w-0 flex flex-col">
        {isOther ? (
          <input
            value={contact.label ?? ""}
            onChange={(e) => onChange(contact.value, e.target.value)}
            placeholder="Platform"
            className="bg-transparent border-0 outline-0 text-[10px] uppercase tracking-[0.05em] font-medium text-[var(--color-fg-muted)] placeholder:text-[var(--color-fg-dim)] py-0"
          />
        ) : (
          <span className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
            {meta.label}
          </span>
        )}
        <div className="flex items-center">
          {meta.prefix && (
            <span className="text-[13px] text-[var(--color-fg-dim)] mr-0.5">
              {meta.prefix}
            </span>
          )}
          <input
            value={contact.value}
            onChange={(e) => onChange(e.target.value, contact.label)}
            placeholder={meta.placeholder}
            className="flex-1 min-w-0 bg-transparent border-0 outline-0 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] py-0.5"
            autoFocus
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-fg-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
        aria-label="Remove"
      >
        <X size={11} />
      </button>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}
