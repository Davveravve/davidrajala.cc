import { getAllProjects, getCategories } from "@/lib/queries";
import { ProjectsExplorer } from "@/components/sections/projects-explorer";
import { SectionLabel } from "@/components/ui/section-label";
import { Reveal } from "@/components/ui/reveal";

export const metadata = {
  title: "Projects — David Rajala",
  description: "A selection of projects I've worked on.",
};

export default async function ProjectsPage() {
  const [projects, categories] = await Promise.all([
    getAllProjects(),
    getCategories(),
  ]);

  return (
    <>
      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-fine opacity-40" aria-hidden />
        <div className="absolute inset-0 bg-radial-fade" aria-hidden />
        <div className="container-page relative">
          <SectionLabel className="mb-6">Portfolio / Projects</SectionLabel>
          <Reveal>
            <h1 className="font-display text-4xl sm:text-5xl md:text-8xl font-medium tracking-tight text-balance leading-[0.95]">
              Everything I&apos;ve <br />
              <span className="text-[var(--color-fg-muted)]">built and designed.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 text-lg text-[var(--color-fg-muted)] max-w-2xl">
              {projects.length} projects — from quick prototypes to full products in production.
            </p>
          </Reveal>
        </div>
      </section>

      <ProjectsExplorer projects={projects} categories={categories} />
    </>
  );
}
