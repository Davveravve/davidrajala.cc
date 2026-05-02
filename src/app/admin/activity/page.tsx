import { prisma } from "@/lib/prisma";
import {
  Activity as ActivityIcon,
  Pencil,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowUpDown,
  Settings,
  User,
  Tag,
  FolderKanban,
  Mail,
  Layout,
} from "lucide-react";

type ActivityRow = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  label: string;
  createdAt: Date;
};

export default async function AdminActivityPage() {
  const rows = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Audit trail
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Activity
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          Recent admin actions, newest first. Up to 100 most recent shown.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <Timeline rows={rows} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] mb-4">
        <ActivityIcon size={22} />
      </div>
      <div className="font-display text-xl mb-1">No activity yet.</div>
      <p className="text-sm text-[var(--color-fg-muted)] max-w-sm mx-auto">
        Actions you take in the admin panel will show up here.
      </p>
    </div>
  );
}

function Timeline({ rows }: { rows: ActivityRow[] }) {
  const groups = groupByDate(rows);

  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <section key={g.heading}>
          <h2 className="text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-4 flex items-center gap-3">
            <span className="h-px w-6 bg-[var(--color-fg-dim)]" />
            {g.heading}
          </h2>
          <ol className="relative border-l border-[var(--color-border)] ml-3 space-y-4 pl-6">
            {g.rows.map((r) => (
              <Entry key={r.id} row={r} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function Entry({ row }: { row: ActivityRow }) {
  const Icon = iconFor(row.action);
  return (
    <li className="relative">
      <span className="absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)]">
        <Icon size={12} />
      </span>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm text-[var(--color-fg)]">{describe(row)}</div>
          <time className="text-[11px] text-[var(--color-fg-dim)] tabular-nums flex-shrink-0">
            {formatRelative(row.createdAt)}
          </time>
        </div>
        <div className="mt-1 text-[11px] text-[var(--color-fg-dim)] font-mono">
          {row.action}
        </div>
      </div>
    </li>
  );
}

function describe(row: ActivityRow): string {
  const lbl = row.label || row.entityId || "";
  switch (row.action) {
    case "project.create":
      return lbl ? `Created project: ${lbl}` : "Created a project";
    case "project.update":
      return lbl ? `Updated project: ${lbl}` : "Updated a project";
    case "project.delete":
      return lbl ? `Deleted project: ${lbl}` : "Deleted a project";
    case "category.create":
      return lbl ? `Created category: ${lbl}` : "Created a category";
    case "category.update":
      return lbl ? `Updated category: ${lbl}` : "Updated a category";
    case "category.delete":
      return lbl ? `Deleted category: ${lbl}` : "Deleted a category";
    case "message.delete":
      return lbl ? `Deleted message ${lbl}` : "Deleted a message";
    case "message.bulkDelete":
      return lbl ? `Bulk-deleted ${lbl}` : "Bulk-deleted messages";
    case "message.read":
      return "Marked message read";
    case "section.update":
      return lbl ? `Updated section: ${lbl}` : "Updated a section";
    case "section.toggle":
      return lbl ? `Toggled section ${lbl}` : "Toggled a section";
    case "section.reorder":
      return lbl ? `Reordered ${lbl}` : "Reordered sections";
    case "settings.update":
      return "Updated site settings";
    case "about.update":
      return lbl ? `Updated about: ${lbl}` : "Updated about page";
    default:
      return lbl ? `${row.action}: ${lbl}` : row.action;
  }
}

function iconFor(action: string) {
  if (action.endsWith(".create")) return Plus;
  if (action.endsWith(".delete") || action.endsWith(".bulkDelete")) return Trash2;
  if (action.endsWith(".update")) return Pencil;
  if (action === "section.toggle") return Eye;
  if (action === "section.reorder") return ArrowUpDown;
  if (action === "settings.update") return Settings;
  if (action.startsWith("about")) return User;
  if (action.startsWith("category")) return Tag;
  if (action.startsWith("project")) return FolderKanban;
  if (action.startsWith("message")) return Mail;
  if (action.startsWith("section")) return Layout;
  // unused placeholder to keep imports stable when an icon's no longer hit
  void EyeOff;
  return ActivityIcon;
}

type Group = { heading: string; rows: ActivityRow[] };

function groupByDate(rows: ActivityRow[]): Group[] {
  const out: Group[] = [];
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const r of rows) {
    const d = startOfDay(r.createdAt);
    let heading: string;
    if (d.getTime() === today.getTime()) heading = "Today";
    else if (d.getTime() === yesterday.getTime()) heading = "Yesterday";
    else heading = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    const last = out[out.length - 1];
    if (last && last.heading === heading) last.rows.push(r);
    else out.push({ heading, rows: [r] });
  }
  return out;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
