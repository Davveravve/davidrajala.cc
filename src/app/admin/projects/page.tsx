import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProjectsAdminList } from "@/components/admin/projects-list";
import { Plus } from "lucide-react";

export default async function AdminProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { order: "asc" },
    include: { category: true },
  });

  return (
    <div className="container-page max-w-7xl py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
            Manage
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">Projects</h1>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            Drag to reorder. Order shows publicly immediately. Star one project to feature it on the home page.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow self-start"
        >
          <Plus size={16} />
          New project
        </Link>
      </div>

      <ProjectsAdminList
        projects={projects.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          coverUrl: p.coverUrl,
          categoryName: p.category?.name ?? null,
          featured: p.featured,
          published: p.published,
          status: p.status,
        }))}
      />
    </div>
  );
}
