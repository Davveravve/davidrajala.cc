import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getAboutMe } from "@/lib/queries";

export const dynamic = "force-dynamic";
import {
  Plus,
  User,
  ExternalLink,
  Settings as SettingsIcon,
  FolderKanban,
  Tag,
  Mail,
  Pencil,
  Inbox,
  Reply,
  ArrowUpRight,
  Activity,
  CheckCheck,
} from "lucide-react";

export default async function AdminDashboard() {
  const [
    about,
    projectCount,
    categoryCount,
    msgCount,
    unreadAll,
    recentProjects,
  ] = await Promise.all([
    getAboutMe(),
    prisma.project.count(),
    prisma.category.count(),
    prisma.contactMessage.count(),
    prisma.contactMessage.findMany({
      where: { read: false, senderType: "customer" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { contacts: { take: 1, where: { type: "email" } } },
    }),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { category: true },
    }),
  ]);

  // Dedupe by thread (email lower-cased) — show one card per person, with
  // the most recent message and a +N badge for the rest.
  const threadMap = new Map<
    string,
    {
      latest: (typeof unreadAll)[number];
      count: number;
    }
  >();
  for (const m of unreadAll) {
    const key = (m.threadKey?.trim() || m.email || m.id).toLowerCase();
    const cur = threadMap.get(key);
    if (!cur) threadMap.set(key, { latest: m, count: 1 });
    else cur.count++;
  }
  const unreadMessages = Array.from(threadMap.values()).slice(0, 3);
  const unreadCount = unreadAll.length;

  const greeting = greetingForHour(new Date().getHours());
  const firstName = about.name.split(" ")[0];

  return (
    <div className="container-page max-w-7xl py-8 md:py-12">
      {/* HERO */}
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3 flex items-center gap-2">
          <span className="h-px w-6 bg-[var(--color-accent)]" />
          {formatToday()}
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-medium tracking-tight">
          {greeting}, <span className="text-[var(--color-fg-muted)]">{firstName}</span>
        </h1>
        <p className="mt-3 text-sm text-[var(--color-fg-muted)] max-w-xl">
          {unreadCount > 0
            ? `You have ${unreadCount} unread ${unreadCount === 1 ? "message" : "messages"} waiting.`
            : "No new messages — your inbox is clear."}
        </p>
      </div>

      {/* QUICK ACTIONS — round buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-12">
        <RoundAction href="/admin/projects/new" icon={Plus} label="New project" primary />
        <RoundAction href="/admin/about" icon={User} label="Edit profile" />
        <RoundAction href="/" target="_blank" icon={ExternalLink} label="View site" />
        <RoundAction href="/admin/settings" icon={SettingsIcon} label="Settings" />
        <span className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--color-border)] text-xs">
          <span
            className={`h-1.5 w-1.5 rounded-full ${about.available ? "bg-[var(--color-accent)]" : "bg-orange-500"}`}
            style={{
              boxShadow: about.available
                ? "0 0 8px var(--color-accent)"
                : "0 0 8px rgb(249 115 22 / 0.6)",
            }}
          />
          <span className="font-mono uppercase tracking-wider text-[10px] text-[var(--color-fg-muted)]">
            {about.available ? "Available" : "Busy"}
          </span>
        </span>
      </div>

      {/* COMPACT STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatTile
          label="Projects"
          value={projectCount}
          icon={<FolderKanban size={14} />}
          href="/admin/projects"
        />
        <StatTile
          label="Categories"
          value={categoryCount}
          icon={<Tag size={14} />}
          href="/admin/categories"
        />
        <StatTile
          label="Messages"
          value={msgCount}
          icon={<Mail size={14} />}
          href="/admin/messages"
          badge={unreadCount > 0 ? `${unreadCount} new` : undefined}
        />
        <StatTile
          label="Activity"
          value={recentProjects[0] ? formatRelative(recentProjects[0].updatedAt) : "—"}
          icon={<Activity size={14} />}
          href="/admin/projects"
          subtle
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-5">
        {/* LEFT — Unread messages */}
        <Panel
          title="Unread messages"
          subtitle={
            unreadCount > 0
              ? `${unreadCount} waiting`
              : "All caught up"
          }
          link={{ href: "/admin/messages", label: msgCount > 0 ? "View all" : undefined }}
          accent={unreadCount > 0}
        >
          {unreadMessages.length > 0 ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {unreadMessages.map(({ latest: m, count }) => {
                const email = m.contacts[0]?.value ?? m.email;
                const initial = m.name.trim()[0]?.toUpperCase() ?? "?";
                return (
                  <li key={m.id}>
                    <Link
                      href="/admin/messages"
                      className="group flex items-start gap-3 px-1 py-4 hover:bg-[var(--color-surface-2)]/50 -mx-1 rounded-lg transition-colors"
                    >
                      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-accent)]/30 text-sm font-medium flex-shrink-0">
                        {initial}
                        <span
                          className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-surface)]"
                          style={{ boxShadow: "0 0 6px var(--color-accent)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-sm truncate">{m.name}</span>
                            {count > 1 && (
                              <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 px-1.5 py-0.5 rounded flex-shrink-0">
                                +{count - 1}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--color-fg-dim)] tabular-nums flex-shrink-0">
                            {formatRelative(m.createdAt)}
                          </span>
                        </div>
                        {email && (
                          <div className="text-[11px] text-[var(--color-fg-dim)] truncate mb-1">
                            {email}
                          </div>
                        )}
                        <p className="text-xs text-[var(--color-fg-muted)] line-clamp-2 leading-snug">
                          {m.message}
                        </p>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] group-hover:bg-[var(--color-surface-2)] transition-colors flex-shrink-0">
                        <Reply size={13} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={<CheckCheck size={20} />}
              title="Inbox zero"
              subtitle={
                msgCount > 0
                  ? "All messages have been read."
                  : "New messages from the chat on your site will show up here."
              }
            />
          )}
        </Panel>

        {/* RIGHT — Recent projects */}
        <Panel
          title="Recent projects"
          subtitle={
            projectCount > 0
              ? `${projectCount} total`
              : "Nothing yet"
          }
          link={{ href: "/admin/projects", label: projectCount > 4 ? "View all" : undefined }}
        >
          {recentProjects.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentProjects.map((p) => (
                <li
                  key={p.id}
                  className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)]/50 transition-colors"
                >
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="block aspect-[16/10] relative overflow-hidden"
                    aria-label={`Edit ${p.title}`}
                  >
                    <Image
                      src={p.coverUrl}
                      alt={p.title}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil size={11} />
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.1em] font-medium text-white/70 mb-1">
                        {p.category && <span>{p.category.name}</span>}
                        <span>·</span>
                        <span>{formatRelative(p.updatedAt)}</span>
                      </div>
                      <div className="font-medium text-sm text-white truncate flex items-center gap-2">
                        {p.title}
                        {!p.published && (
                          <span className="text-[9px] font-mono uppercase tracking-wider text-orange-300 border border-orange-300/40 px-1 py-px rounded">
                            draft
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <Link
                    href={`/projects/${p.slug}`}
                    target="_blank"
                    aria-label={`Open ${p.title} publicly`}
                    className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--color-accent)]"
                  >
                    <ArrowUpRight size={11} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Inbox size={20} />}
              title="No projects yet"
              subtitle="Create your first project to see it here."
              action={{ href: "/admin/projects/new", label: "New project" }}
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

function RoundAction({
  href,
  icon: Icon,
  label,
  target,
  primary,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  target?: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      target={target}
      className={`group inline-flex items-center gap-2 rounded-full pl-2 pr-4 py-2 text-sm font-medium transition-all ${
        primary
          ? "bg-[var(--color-accent)] text-[var(--color-bg)] hover:shadow-[0_0_24px_var(--color-accent-glow)]"
          : "border border-[var(--color-border)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-border-strong)]"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full ${
          primary
            ? "bg-[var(--color-bg)]/15"
            : "bg-[var(--color-surface)] text-[var(--color-accent)]"
        }`}
      >
        <Icon size={13} />
      </span>
      {label}
    </Link>
  );
}

function StatTile({
  label,
  value,
  icon,
  href,
  badge,
  subtle,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  subtle?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)]/50 transition-colors"
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          badge
            ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
            : "bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]"
        }`}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-display ${subtle ? "text-base" : "text-2xl"} font-medium tabular-nums`}
          >
            {value}
          </span>
          {badge && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent)]">
              {badge}
            </span>
          )}
        </div>
        <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
          {label}
        </div>
      </div>
    </Link>
  );
}

function Panel({
  title,
  subtitle,
  link,
  accent,
  children,
}: {
  title: string;
  subtitle?: string;
  link?: { href: string; label?: string };
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border bg-[var(--color-surface)] ${
        accent ? "border-[var(--color-accent)]/30" : "border-[var(--color-border)]"
      }`}
    >
      <header className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-medium flex items-center gap-2">
            {title}
            {accent && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
                style={{ boxShadow: "0 0 6px var(--color-accent)" }}
              />
            )}
          </h2>
          {subtitle && (
            <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
        {link?.label && (
          <Link
            href={link.href}
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            {link.label}
            <ArrowUpRight size={11} />
          </Link>
        )}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="text-center py-10">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] mb-3">
        {icon}
      </div>
      <div className="font-display text-base font-medium mb-1">{title}</div>
      {subtitle && (
        <p className="text-xs text-[var(--color-fg-muted)] max-w-xs mx-auto">{subtitle}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-medium hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow"
        >
          <Plus size={12} />
          {action.label}
        </Link>
      )}
    </div>
  );
}

function greetingForHour(h: number) {
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatRelative(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
