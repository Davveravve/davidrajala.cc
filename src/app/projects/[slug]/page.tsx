import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Github, Globe } from "lucide-react";
import { getAllProjectSlugs, getProjectBySlug } from "@/lib/queries";
import { parseList } from "@/lib/queries";
import { Reveal } from "@/components/ui/reveal";
import { ProjectGallery, ProjectCover } from "@/components/project/project-gallery";

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

  const tech = parseList(project.techStack);

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

      {/* next CTA */}
      <section className="relative pb-32">
        <div className="container-page">
          <Link
            href="/projects"
            className="group flex items-center justify-between gap-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 hover:border-[var(--color-accent)] transition-colors"
          >
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-2">
                Back to
              </div>
              <div className="font-display text-3xl md:text-5xl font-medium tracking-tight">
                All projects
              </div>
            </div>
            <ArrowUpRight
              size={32}
              className="text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] group-hover:rotate-45 transition-all duration-500"
            />
          </Link>
        </div>
      </section>
    </article>
  );
}
