import { EventEmitter } from "node:events";

/// Process-local pub/sub for instant chat & message notifications.
///
/// Why module-level + globalThis: Next.js dev server reloads modules, which
/// would otherwise create new EventEmitters that listeners hang off of.
/// Persisting across reloads via globalThis keeps SSE connections sticky.
///
/// In production this is a single Node process behind Caddy, so a plain
/// EventEmitter is enough. If we ever scale to multiple Node instances
/// we'd swap this for Postgres LISTEN/NOTIFY or Redis pub/sub.

declare global {
  // eslint-disable-next-line no-var
  var __chatBus: EventEmitter | undefined;
}

function getBus(): EventEmitter {
  if (!globalThis.__chatBus) {
    const bus = new EventEmitter();
    bus.setMaxListeners(0);
    globalThis.__chatBus = bus;
  }
  return globalThis.__chatBus;
}

export const chatBus = getBus();

export type ChatBusMessage = {
  threadKey: string;
  message: {
    id: string;
    senderType: "customer" | "admin";
    message: string;
    createdAt: string;
    name: string;
  };
};

/// Emit a new chat message — both per-thread (for the chat panel) and
/// the broadcast channel (for the admin notifications stream).
export function emitChatMessage(payload: ChatBusMessage) {
  chatBus.emit("any", payload);
  chatBus.emit(`thread:${payload.threadKey}`, payload);
}
