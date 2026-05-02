import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MessagesView } from "@/components/admin/messages-view";

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

  const where =
    view === "read"
      ? { read: true, saved: false }
      : view === "saved"
        ? { saved: true }
        : { read: false };

  const [messages, counts] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { contacts: { orderBy: { createdAt: "asc" } } },
    }),
    Promise.all([
      prisma.contactMessage.count({ where: { read: false } }),
      prisma.contactMessage.count({ where: { read: true, saved: false } }),
      prisma.contactMessage.count({ where: { saved: true } }),
    ]).then(([inbox, read, saved]) => ({ inbox, read, saved })),
  ]);

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

      <MessagesView
        view={view}
        messages={messages.map((m) => ({
          id: m.id,
          name: m.name,
          message: m.message,
          read: m.read,
          saved: m.saved,
          createdAt: m.createdAt.toISOString(),
          contacts: m.contacts.map((c) => ({
            id: c.id,
            type: c.type,
            value: c.value,
            label: c.label,
          })),
        }))}
      />
    </div>
  );
}
