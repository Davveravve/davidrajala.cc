import { SectionLabel } from "@/components/ui/section-label";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "./featured-projects";
import type { Project, Category, HomeSection } from "@prisma/client";

type ProjectWithCat = Project & { category: Category | null };

export function LatestProjects({
  projects,
  config,
}: {
  projects: ProjectWithCat[];
  config?: HomeSection | null;
}) {
  if (projects.length === 0) return null;

  const eyebrow = config?.eyebrow ?? "Recent work";
  const title = config?.title ?? "Recent projects,";
  const titleMuted = config?.titleMuted ?? "hand-crafted and tuned.";
  const ctaLabel = config?.ctaLabel ?? "All projects";
  const ctaHref = config?.ctaHref ?? "/projects";

  return (
    <section id="projects" className="relative py-24 md:py-32 overflow-hidden">
      <div className="container-page">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div>
            <SectionLabel className="mb-6">{eyebrow}</SectionLabel>
            <Reveal>
              <h2 className="font-display text-4xl md:text-7xl font-medium tracking-tight max-w-3xl text-balance">
                {title}
                {titleMuted && (
                  <>
                    <br />
                    <span className="text-[var(--color-fg-muted)]">{titleMuted}</span>
                  </>
                )}
              </h2>
            </Reveal>
          </div>
          {ctaLabel && (
            <Reveal delay={0.2}>
              <Button href={ctaHref || "/projects"} variant="outline" arrow>
                {ctaLabel}
              </Button>
            </Reveal>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
