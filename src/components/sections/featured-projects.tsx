"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/section-label";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import type { Project, Category } from "@prisma/client";

type ProjectWithCat = Project & { category: Category | null };

export function FeaturedProjects({ projects }: { projects: ProjectWithCat[] }) {
  if (projects.length === 0) return null;

  return (
    <section id="projects" className="relative py-32 overflow-hidden">
      <div className="container-page">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <SectionLabel className="mb-6">Utvalda projekt</SectionLabel>
            <Reveal>
              <h2 className="font-display text-5xl md:text-7xl font-medium tracking-tight max-w-3xl text-balance">
                Senaste arbetet,
                <br />
                <span className="text-[var(--color-fg-muted)]">
                  hand-byggt och optimerat.
                </span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <Button href="/projects" variant="outline" arrow>
              Alla projekt
            </Button>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} large={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProjectCard({
  project,
  large = false,
}: {
  project: ProjectWithCat;
  large?: boolean;
}) {
  const cardRef = useRef<HTMLAnchorElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  function onMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = cardRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;
    // Skip on touch devices.
    if (window.matchMedia("(hover: none)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    // Map [0,1] → [-1,1], scale to a small tilt (max ~6deg)
    const rotateY = (x - 0.5) * 8;
    const rotateX = (0.5 - y) * 8;
    inner.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  function onMouseLeave() {
    const inner = innerRef.current;
    if (!inner) return;
    inner.style.transform =
      "perspective(1200px) rotateX(0deg) rotateY(0deg)";
  }

  return (
    <Reveal className={large ? "md:col-span-2" : "h-full"}>
      <Link
        ref={cardRef}
        href={`/projects/${project.slug}`}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="group relative block h-full"
        style={{ perspective: "1200px" }}
      >
        <div
          ref={innerRef}
          className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-[transform,border-color] duration-300 ease-out will-change-transform hover:border-[var(--color-accent)]"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className={`relative overflow-hidden ${large ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
            <Image
              src={project.coverUrl}
              alt={project.title}
              fill
              sizes={large ? "(min-width: 768px) 100vw, 100vw" : "(min-width: 768px) 50vw, 100vw"}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/40 to-transparent" />
            {/* hover scan line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex flex-1 flex-col p-5 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
                {project.category && (
                  <>
                    <span>{project.category.name}</span>
                    <span className="h-px w-6 bg-[var(--color-border-strong)]" />
                  </>
                )}
                <span className="text-[var(--color-fg-dim)]">
                  {String(project.order + 1).padStart(2, "0")}
                </span>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-fg-muted)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)] group-hover:rotate-45 transition-all duration-500">
                <ArrowUpRight size={14} />
              </span>
            </div>

            <h3 className="font-display text-2xl md:text-3xl font-medium tracking-tight mb-2 group-hover:text-[var(--color-accent)] transition-colors">
              {project.title}
            </h3>
            <p className="text-[var(--color-fg-muted)] text-sm leading-relaxed line-clamp-2">
              {project.summary}
            </p>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
