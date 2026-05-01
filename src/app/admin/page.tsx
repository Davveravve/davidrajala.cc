import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowUpRight, FolderKanban, Mail, Tag, User } from "lucide-react";

export default async function AdminDashboard() {
  const [projectCount, categoryCount, msgCount, unreadCount] = await Promise.all([
    prisma.project.count(),
    prisma.category.count(),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { read: false } }),
  ]);

  const recent = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { category: true },
  });

  return (
    <div className="container-page max-w-7xl py-8 md:py-12">
      <div className="mb-12">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Overview
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Projects"
          value={projectCount}
          icon={<FolderKanban size={16} />}
          href="/admin/projekt"
        />
        <StatCard
          label="Categories"
          value={categoryCount}
          icon={<Tag size={16} />}
          href="/admin/kategorier"
        />
        <StatCard
          label="Messages"
          value={msgCount}
          subtext={`${unreadCount} unread`}
          icon={<Mail size={16} />}
          href="/admin/meddelanden"
        />
        <StatCard
          label="About"
          value="—"
          icon={<User size={16} />}
          href="/admin/om-mig"
        />
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-display text-lg font-medium">Recently updated projects</h2>
          <Link
            href="/admin/projekt"
            className="text-xs uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            See all →
          </Link>
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          {recent.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/projekt/${p.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-[var(--color-fg-muted)] mt-1">
                    {p.category?.name ?? "—"} · updated{" "}
                    {new Date(p.updatedAt).toLocaleDateString("en-GB")}
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-[var(--color-fg-muted)]" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  href,
}: {
  label: string;
  value: number | string;
  subtext?: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-accent)] transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-accent)]">
          {icon}
        </span>
        <ArrowUpRight
          size={14}
          className="text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] group-hover:rotate-45 transition-all duration-500"
        />
      </div>
      <div className="font-display text-3xl font-medium tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mt-1">
        {label}
      </div>
      {subtext && (
        <div className="text-xs text-[var(--color-accent)] mt-2">{subtext}</div>
      )}
    </Link>
  );
}
