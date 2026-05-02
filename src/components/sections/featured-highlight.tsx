import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { parseList } from "@/lib/queries";
import type { Project, Category, ProjectImage } from "@prisma/client";

type FeaturedProject = Project & {
  category: Category | null;
  images: ProjectImage[];
};

export function FeaturedHighlight({ project }: { project: FeaturedProject }) {
  const tech = parseList(project.techStack).slice(0, 5);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="container-page">
        <Reveal>
          <Link
            href={`/projects/${project.slug}`}
            className="group relative block overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-all duration-500"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[520px] overflow-hidden order-1 lg:order-2">
                <Image
                  src={project.coverUrl}
                  alt={project.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-surface)]/30 to-transparent lg:from-[var(--color-surface)] lg:via-[var(--color-surface)]/40" />
                <div className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg)]/80 backdrop-blur-sm border border-[var(--color-accent)]/30 text-[10px] uppercase tracking-[0.15em] font-medium text-[var(--color-accent)]">
                  <Sparkles size={11} />
                  Featured
                </div>
              </div>

              <div className="relative p-8 md:p-12 lg:p-16 flex flex-col justify-between gap-10 order-2 lg:order-1">
                <div>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-6">
                    <span className="h-px w-6 bg-[var(--color-accent)]" />
                    {project.category?.name ?? "Project"}
                  </div>

                  <h2 className="font-display text-4xl md:text-6xl font-medium tracking-tight text-balance leading-[0.95]">
                    {project.title}
                  </h2>

                  <p className="mt-6 text-lg text-[var(--color-fg-muted)] leading-relaxed text-pretty max-w-xl">
                    {project.summary}
                  </p>

                  {tech.length > 0 && (
                    <ul className="mt-8 flex flex-wrap gap-2">
                      {tech.map((t) => (
                        <li
                          key={t}
                          className="px-2.5 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-xs text-[var(--color-fg-muted)]"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
                    View case study
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-fg-muted)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)] group-hover:rotate-45 transition-all duration-500">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
