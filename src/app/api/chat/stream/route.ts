import { NextRequest } from "next/server";
import { chatBus, type ChatBusMessage } from "@/lib/chat-bus";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { threadKeyFor } from "@/lib/chat-thread";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// Server-Sent Events stream for one chat thread. Subscribed by the chat
/// panel when open. Emits `data: {message...}\n\n` for each new message
/// in this thread (customer OR admin reply), plus heartbeat comments to
/// keep the connection alive through proxies.
///
/// Auth model:
/// - Logged-in customer: thread is locked to their own email; the `key`
///   query param is ignored to prevent enumeration.
/// - Anonymous visitor: trusts the `key` they pass (their own email).
///   Same trust model as the polling fallback.
export async function GET(req: NextRequest) {
  const customer = await getCurrentCustomer();
  let threadKey = req.nextUrl.searchParams.get("key") ?? "";
  if (customer) threadKey = threadKeyFor(customer.email);
  if (!threadKey) {
    return new Response("Missing key", { status: 400 });
  }

  const eventName = `thread:${threadKey}`;
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      function safeWrite(chunk: string) {
        if (closed) return;
        try {
          controller.enqueue(enc.encode(chunk));
        } catch {
          closed = true;
        }
      }

      // Initial comment so EventSource flips to OPEN immediately.
      safeWrite(": connected\n\n");

      const onMessage = (e: ChatBusMessage) => {
        safeWrite(`data: ${JSON.stringify(e.message)}\n\n`);
      };
      chatBus.on(eventName, onMessage);

      // Heartbeat every 25s — keeps Caddy / browsers from killing idle.
      const heartbeat = setInterval(() => safeWrite(": ping\n\n"), 25_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        chatBus.off(eventName, onMessage);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
