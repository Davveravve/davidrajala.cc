import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { threadKeyFor } from "@/lib/chat-thread";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/thread?key=<threadKey>
 *
 * Returns all messages in a single thread, ascending. Used by the public
 * chat panel to poll for admin replies.
 *
 * SECURITY (v1):
 *  - If a customer is signed in, we ignore the requested key and force it
 *    to that customer's email. They can only ever see their own thread.
 *  - For anonymous visitors we accept the key from the query string. This
 *    means a malicious actor who knows / guesses someone's email address
 *    could enumerate the messages they sent us. That replay risk is
 *    acceptable for a contact-form-grade chat: messages contain no
 *    secrets, the surface is tiny (an email guess), and the alternative
 *    (signed cookies) doesn't survive cross-device usage from the same
 *    visitor. Revisit if/when we attach files or auth tokens to messages.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedKeyRaw = searchParams.get("key") ?? "";

  const customer = await getCurrentCustomer();
  const key = customer
    ? threadKeyFor(customer.email)
    : threadKeyFor(requestedKeyRaw);

  if (!key) {
    return NextResponse.json({ messages: [] });
  }

  const rows = await prisma.contactMessage.findMany({
    where: { threadKey: key },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({
    messages: rows.map((m) => ({
      id: m.id,
      senderType: m.senderType === "admin" ? "admin" : "customer",
      message: m.message,
      createdAt: m.createdAt.toISOString(),
      name: m.name,
    })),
  });
}
