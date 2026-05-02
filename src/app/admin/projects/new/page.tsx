import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/admin/project-form";

export default async function NewProjectPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="container-page max-w-4xl py-8 md:py-12">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Back to projects
      </Link>

      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          New project
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Create project
        </h1>
      </div>

      <ProjectForm mode="create" categories={categories} />
    </div>
  );
}
