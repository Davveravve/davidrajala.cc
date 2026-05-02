import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MessagesView, type Thread, type ThreadMsg } from "@/components/admin/messages-view";

type View = "inbox" | "read" | "saved";

function parseView(v?: string | string[]): View {
  if (v === "read" || v === "saved") return v;
  return "inbox";
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const sp = await searchParams;
  const view = parseView(sp.view);

  // Pull ALL messages once, group client-side by threadKey. Volumes here are
  // tiny (a contact form, not a chat at scale) so this is the simplest correct
  // approach — and it lets us know unread/saved counts per thread without N+1.
  const all = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "asc" },
    include: { contacts: { orderBy: { createdAt: "asc" } } },
  });

  // Group by threadKey (fall back to message id for legacy rows with empty key).
  const byKey = new Map<string, typeof all>();
  for (const m of all) {
    const key = m.threadKey?.trim() || `__legacy:${m.id}`;
    const arr = byKey.get(key);
    if (arr) arr.push(m);
    else byKey.set(key, [m]);
  }

  const allThreads: Thread[] = Array.from(byKey.entries()).map(([key, msgs]) => {
    const sorted = [...msgs].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const customerMsgs = sorted.filter((m) => m.senderType !== "admin");
    const latest = sorted[sorted.length - 1];
    // Prefer the first customer message for the canonical name/contacts
    const starter = customerMsgs[0] ?? sorted[0];
    const unreadCount = customerMsgs.filter((m) => !m.read).length;
    const anySaved = sorted.some((m) => m.saved);

    const messages: ThreadMsg[] = sorted.map((m) => ({
      id: m.id,
      message: m.message,
      senderType: m.senderType === "admin" ? "admin" : "customer",
      read: m.read,
      saved: m.saved,
      createdAt: m.createdAt.toISOString(),
      name: m.name,
    }));

    return {
      threadKey: key,
      // a representative id (latest message) used as the React key + selection target
      id: latest.id,
      // canonical sender name + email for the thread header
      name: starter.name,
      email: starter.email,
      // most recent text snippet for the list preview
      lastMessage: latest.message,
      lastSenderType:
        latest.senderType === "admin" ? "admin" : "customer",
      lastCreatedAt: latest.createdAt.toISOString(),
      unreadCount,
      saved: anySaved,
      contacts: (starter.contacts ?? []).map((c) => ({
        id: c.id,
        type: c.type,
        value: c.value,
        label: c.label,
      })),
      messages,
    } satisfies Thread;
  });

  // Sort threads newest-first by last message time.
  allThreads.sort((a, b) =>
    b.lastCreatedAt.localeCompare(a.lastCreatedAt),
  );

  const threads: Thread[] = allThreads.filter((t) => {
    if (view === "saved") return t.saved;
    if (view === "read") return t.unreadCount === 0 && !t.saved;
    // inbox: anything with at least one unread customer message
    return t.unreadCount > 0;
  });

  const counts = {
    inbox: allThreads.filter((t) => t.unreadCount > 0).length,
    read: allThreads.filter((t) => t.unreadCount === 0 && !t.saved).length,
    saved: allThreads.filter((t) => t.saved).length,
  };

  const tabs: { key: View; label: string; count: number }[] = [
    { key: "inbox", label: "Inbox", count: counts.inbox },
    { key: "read", label: "Read", count: counts.read },
    { key: "saved", label: "Saved", count: counts.saved },
  ];

  return (
    <div className="container-page max-w-7xl py-8 md:py-12">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Inbox
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">Messages</h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          Conversations from the chat on your site.
        </p>
      </div>

      <nav className="flex items-center gap-1 mb-6 border-b border-[var(--color-border)]">
        {tabs.map((t) => {
          const active = t.key === view;
          return (
            <Link
              key={t.key}
              href={t.key === "inbox" ? "/admin/messages" : `/admin/messages?view=${t.key}`}
              className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                active
                  ? "text-[var(--color-fg)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              {t.label}
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full tabular-nums ${
                  active
                    ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                    : "bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]"
                }`}
              >
                {t.count}
              </span>
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <MessagesView view={view} threads={threads} />
    </div>
  );
}
