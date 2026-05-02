"use client";

import { useEffect, useRef } from "react";
import { ToasterProvider, Toaster, useToaster } from "./toaster";
import { useChat } from "@/components/chat/chat-context";

const POLL_INTERVAL_MS = 30_000;
const STORAGE_KEY = "customer-toaster-shown-v1";
const CHAT_STORAGE_KEY = "customer-chat-toaster-shown-v1";

type GiftItem = {
  id: string;
  title: string;
  note: string;
  createdAt: string;
};

/**
 * Mounts the toaster + a 30s poller for `/api/store/notifications` (gifts)
 * + an SSE subscription for chat replies on the signed-in customer's thread.
 * Only renders when a customer is signed in (decided server-side and passed
 * down via `signedIn` so we don't ship a polling client to anonymous users).
 */
export function CustomerToaster({
  signedIn,
  threadKey,
}: {
  signedIn: boolean;
  threadKey: string | null;
}) {
  if (!signedIn) return null;
  return (
    <ToasterProvider>
      <Toaster />
      <CustomerNotificationsPoller />
      {threadKey && <CustomerChatStream threadKey={threadKey} />}
    </ToasterProvider>
  );
}

/**
 * Listens for admin replies on the customer's chat thread via SSE and
 * pops a toast (unless the chat panel is currently open — then the
 * message renders inline and a toast would be noise).
 */
function CustomerChatStream({ threadKey }: { threadKey: string }) {
  const { push } = useToaster();
  const { open, setOpen } = useChat();
  const openRef = useRef(open);
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Hydrate already-seen ids so the same message doesn't re-toast on
  // reload during the same session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          shownRef.current = new Set(
            parsed.filter((x): x is string => typeof x === "string"),
          );
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const es = new EventSource(
      `/api/chat/stream?key=${encodeURIComponent(threadKey)}`,
    );
    type Payload = {
      id: string;
      senderType: "customer" | "admin";
      message: string;
      createdAt: string;
      name: string;
    };
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as Payload;
        // Only toast admin replies — never echo the customer's own sends.
        if (msg.senderType !== "admin") return;
        if (shownRef.current.has(msg.id)) return;
        shownRef.current.add(msg.id);
        try {
          window.sessionStorage.setItem(
            CHAT_STORAGE_KEY,
            JSON.stringify([...shownRef.current]),
          );
        } catch {
          // Ignore quota errors.
        }
        // If chat is open, the panel itself renders the new message
        // inline — skip the toast to avoid duplicate noise.
        if (openRef.current) return;
        push({
          id: msg.id,
          title: "💬 New reply",
          body: msg.message.length > 120
            ? `${msg.message.slice(0, 117)}...`
            : msg.message,
          variant: "default",
          // Click → open the chat panel instead of navigating away.
          onClick: () => setOpen(true),
        });
      } catch {
        // ignore malformed
      }
    };
    return () => es.close();
  }, [threadKey, push, setOpen]);

  return null;
}

function CustomerNotificationsPoller() {
  const { push } = useToaster();
  // Track ids we've shown across polls (and across reloads, via sessionStorage).
  const shownRef = useRef<Set<string>>(new Set());
  const firstRunRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          shownRef.current = new Set(parsed.filter((x): x is string => typeof x === "string"));
        }
      }
    } catch {
      // Ignore — corrupt storage shouldn't block the UI.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const res = await fetch("/api/store/notifications", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: GiftItem[] };
        if (cancelled || !data.items) return;

        const isFirstRun = firstRunRef.current;
        firstRunRef.current = false;

        const newlyShown: string[] = [];
        for (const item of data.items) {
          if (shownRef.current.has(item.id)) continue;
          shownRef.current.add(item.id);
          newlyShown.push(item.id);

          // On first run after page load, seed the "shown" set silently so
          // refreshes don't re-fire toasts for gifts the user already saw.
          if (isFirstRun) continue;

          const body = item.note ? item.note : item.title;
          push({
            id: item.id,
            title: "🎁 You've been gifted!",
            body: body.length > 120 ? `${body.slice(0, 117)}...` : body,
            href: `/store/orders/${item.id}`,
            variant: "success",
          });
        }

        if (newlyShown.length > 0 && typeof window !== "undefined") {
          try {
            window.sessionStorage.setItem(
              STORAGE_KEY,
              JSON.stringify([...shownRef.current]),
            );
          } catch {
            // Ignore quota errors — at worst we re-show on next reload.
          }
        }
      } catch {
        // Network errors are non-fatal — try again on next tick.
      } finally {
        if (!cancelled) {
          timer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [push]);

  return null;
}
