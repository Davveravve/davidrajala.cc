import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/admin/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, categories] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!project) notFound();

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
          Edit
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">{project.title}</h1>
      </div>

      <ProjectForm
        mode="edit"
        categories={categories}
        project={{
          id: project.id,
          slug: project.slug,
          title: project.title,
          summary: project.summary,
          body: project.body,
          coverUrl: project.coverUrl,
          liveUrl: project.liveUrl,
          repoUrl: project.repoUrl,
          techStack: project.techStack,
          categoryId: project.categoryId,
          featured: project.featured,
          published: project.published,
          status: project.status,
          hasCaseStudy: project.hasCaseStudy,
          caseChallenge: project.caseChallenge,
          caseProcess: project.caseProcess,
          caseOutcome: project.caseOutcome,
          caseLessons: project.caseLessons,
          beforeUrl: project.beforeUrl,
          afterUrl: project.afterUrl,
          images: project.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt })),
        }}
      />
    </div>
  );
}
