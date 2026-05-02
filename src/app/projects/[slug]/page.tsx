import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Github, Globe } from "lucide-react";
import { getAllProjectSlugs, getProjectBySlug } from "@/lib/queries";
import { parseList } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/ui/reveal";
import { ProjectGallery, ProjectCover } from "@/components/project/project-gallery";
import { BeforeAfterSlider } from "@/components/project/before-after-slider";
import { ProjectCard } from "@/components/sections/featured-projects";

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.title} — David Rajala`,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      images: [project.coverUrl],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  // Increment view counter (fire-and-forget — never block render).
  await prisma.project
    .update({ where: { id: project.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const tech = parseList(project.techStack);

  // Case study sub-blocks — only render those with content.
  const caseBlocks = [
    { label: "Challenge", text: project.caseChallenge },
    { label: "Process", text: project.caseProcess },
    { label: "Outcome", text: project.caseOutcome },
    { label: "Lessons learned", text: project.caseLessons },
  ].filter((b) => b.text && b.text.trim().length > 0);

  // Related projects: prefer same category, then top up with most-recent overall.
  const sameCategory = await prisma.project.findMany({
    where: {
      published: true,
      id: { not: project.id },
      ...(project.categoryId ? { categoryId: project.categoryId } : {}),
    },
    include: { category: true },
    orderBy: { order: "asc" },
    take: 3,
  });

  let related = sameCategory;
  if (related.length < 3) {
    const excludeIds = [project.id, ...related.map((p) => p.id)];
    const fillers = await prisma.project.findMany({
      where: {
        published: true,
        id: { notIn: excludeIds },
      },
      include: { category: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 3 - related.length,
    });
    related = [...related, ...fillers];
  }

  return (
    <article className="relative">
      {/* hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-fine opacity-30" aria-hidden />
        <div className="container-page relative">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.08em] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-12 group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            All projects
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            <div className="lg:col-span-8">
              <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] flex items-center gap-3 mb-6">
                {project.category && (
                  <>
                    <span>{project.category.name}</span>
                    <span className="h-px w-8 bg-[var(--color-border-strong)]" />
                  </>
                )}
                <span className="text-[var(--color-fg-dim)]">
                  {String(project.order + 1).padStart(2, "0")}
                </span>
              </div>
              <Reveal>
                <h1 className="font-display text-4xl sm:text-5xl md:text-8xl font-medium tracking-tight leading-[0.95] text-balance">
                  {project.title}
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-8 text-xl md:text-2xl text-[var(--color-fg-muted)] leading-relaxed max-w-3xl text-pretty">
                  {project.summary}
                </p>
              </Reveal>
            </div>

            <aside className="lg:col-span-4 lg:pt-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-6">
                {tech.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-3">
                      Stack
                    </div>
                    <ul className="flex flex-wrap gap-2">
                      {tech.map((t) => (
                        <li
                          key={t}
                          className="px-2.5 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] text-xs text-[var(--color-fg-muted)]"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(project.liveUrl || project.repoUrl) && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-3">
                      Links
                    </div>
                    <div className="flex flex-col gap-2">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <Globe size={14} />
                            Live demo
                          </span>
                          <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </a>
                      )}
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <Github size={14} />
                            Source
                          </span>
                          <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-3">
                    Stats
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg)]">
                    {project.viewCount.toLocaleString()} views
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* hero image */}
          <Reveal delay={0.3}>
            <ProjectCover url={project.coverUrl} alt={project.title} />
          </Reveal>
        </div>
      </section>

      {/* body */}
      {project.body && (
        <section className="relative py-24">
          <div className="container-page max-w-3xl">
            <Reveal>
              <div className="prose prose-invert max-w-none">
                {project.body.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="text-lg md:text-xl text-[var(--color-fg-muted)] leading-relaxed mb-6 text-pretty"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* case study */}
      {project.hasCaseStudy && caseBlocks.length > 0 && (
        <section className="relative pb-24">
          <div className="container-page">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-14">
              {caseBlocks.map((block, i) => (
                <Reveal key={block.label} delay={i * 0.05}>
                  <div className="max-w-xl">
                    <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-accent)] mb-4">
                      {block.label}
                    </div>
                    <div className="prose prose-invert max-w-none">
                      {block.text.split("\n\n").map((para, j) => (
                        <p
                          key={j}
                          className="text-base md:text-lg text-[var(--color-fg-muted)] leading-relaxed mb-4 text-pretty"
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* before/after slider */}
      {project.beforeUrl && project.afterUrl && (
        <section className="relative pb-24">
          <div className="container-page">
            <Reveal>
              <BeforeAfterSlider
                before={project.beforeUrl}
                after={project.afterUrl}
                alt={project.title}
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* gallery */}
      {project.images.length > 0 && (
        <section className="relative pb-32">
          <div className="container-page">
            <ProjectGallery
              images={project.images.map((img) => ({
                id: img.id,
                url: img.url,
                alt: img.alt,
              }))}
              projectTitle={project.title}
            />
          </div>
        </section>
      )}

      {/* related projects */}
      {related.length > 0 && (
        <section className="relative pb-20">
          <div className="container-page">
            <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-8">
              Next projects
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* secondary all-projects link */}
      <section className="relative pb-32">
        <div className="container-page">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.08em] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors group"
          >
            All projects
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </section>
    </article>
  );
}
