import { NextRequest } from "next/server";
import { chatBus, type ChatBusMessage } from "@/lib/chat-bus";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// SSE stream for admin: pushes any new customer-sent message in real time.
/// Used by the admin toaster instead of polling so notifications land
/// immediately while the admin browses any /admin/* page.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

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

      safeWrite(": connected\n\n");

      const onMessage = (e: ChatBusMessage) => {
        // Admin only cares about customer-originated messages here —
        // their own replies don't need to toast on their own screen.
        if (e.message.senderType !== "customer") return;
        safeWrite(`data: ${JSON.stringify(e.message)}\n\n`);
      };
      chatBus.on("any", onMessage);

      const heartbeat = setInterval(() => safeWrite(": ping\n\n"), 25_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        chatBus.off("any", onMessage);
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
