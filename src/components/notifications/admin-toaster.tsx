"use client";

import { useEffect, useRef } from "react";
import { ToasterProvider, Toaster, useToaster } from "./toaster";

const POLL_INTERVAL_MS = 20_000;
const STORAGE_KEY = "admin-toaster-shown-v1";

type MessageItem = {
  id: string;
  name: string;
  snippet: string;
  createdAt: string;
};

/**
 * Mounts the admin toaster + a 20s poller for `/api/admin/notifications`.
 * Render this only inside admin-authenticated layouts.
 */
export function AdminToaster() {
  return (
    <ToasterProvider>
      <Toaster />
      <AdminNotificationsPoller />
    </ToasterProvider>
  );
}

function AdminNotificationsPoller() {
  const { push } = useToaster();
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
        const res = await fetch("/api/admin/notifications", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: MessageItem[] };
        if (cancelled || !data.items) return;

        const isFirstRun = firstRunRef.current;
        firstRunRef.current = false;

        const newlyShown: string[] = [];
        for (const item of data.items) {
          if (shownRef.current.has(item.id)) continue;
          shownRef.current.add(item.id);
          newlyShown.push(item.id);

          // Seed silently on first poll after mount — only flag truly new
          // arrivals during this session.
          if (isFirstRun) continue;

          push({
            id: item.id,
            title: "💬 New message",
            body: `${item.name}: ${item.snippet}`,
            href: "/admin/messages",
            variant: "default",
          });
        }

        if (newlyShown.length > 0 && typeof window !== "undefined") {
          try {
            window.sessionStorage.setItem(
              STORAGE_KEY,
              JSON.stringify([...shownRef.current]),
            );
          } catch {
            // Ignore quota errors.
          }
        }
      } catch {
        // Non-fatal.
      } finally {
        if (!cancelled) {
          timer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      }
    }

    tick();

    // Live SSE: instant toast as soon as a customer sends a message,
    // no waiting for the next 20s poll. Polling stays as fallback.
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
        if (shownRef.current.has(msg.id)) return;
        shownRef.current.add(msg.id);
        push({
          id: msg.id,
          title: "💬 New message",
          body: `${msg.name}: ${msg.message.slice(0, 80)}`,
          href: "/admin/messages",
          variant: "default",
        });
        try {
          window.sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([...shownRef.current]),
          );
        } catch {
          // Ignore quota errors.
        }
      } catch {
        // Malformed frame — ignore.
      }
    };

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      es.close();
    };
  }, [push]);

  return null;
}
