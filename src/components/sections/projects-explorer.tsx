"use client";

import { useMemo, useState } from "react";
import type { Project, Category } from "@prisma/client";
import { ProjectCard } from "./featured-projects";
import { motion, AnimatePresence } from "framer-motion";

type ProjectWithCat = Project & { category: Category | null };

export function ProjectsExplorer({
  projects,
  categories,
}: {
  projects: ProjectWithCat[];
  categories: Category[];
}) {
  const [active, setActive] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!active) return projects;
    return projects.filter((p) => p.categoryId === active);
  }, [projects, active]);

  return (
    <section className="relative pb-32">
      <div className="container-page">
        <div className="flex flex-wrap items-center gap-2 mb-12">
          <button
            onClick={() => setActive(null)}
            className={`relative px-4 py-2 rounded-full text-sm uppercase tracking-[0.08em] font-medium transition-colors ${
              active === null
                ? "text-[var(--color-bg)]"
                : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            }`}
          >
            {active === null && (
              <motion.span
                layoutId="filter-active"
                className="absolute inset-0 rounded-full bg-[var(--color-accent)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">All ({projects.length})</span>
          </button>
          {categories.map((cat) => {
            const count = projects.filter((p) => p.categoryId === cat.id).length;
            if (count === 0) return null;
            const isActive = active === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={`relative px-4 py-2 rounded-full text-sm uppercase tracking-[0.08em] font-medium border border-[var(--color-border)] transition-colors ${
                  isActive
                    ? "text-[var(--color-bg)] border-[var(--color-accent)]"
                    : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="filter-active"
                    className="absolute inset-0 rounded-full bg-[var(--color-accent)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">
                  {cat.name} ({count})
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={active ?? "all"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-[var(--color-fg-muted)] text-sm">
            No projects in this category yet.
          </div>
        )}
      </div>
    </section>
  );
}
