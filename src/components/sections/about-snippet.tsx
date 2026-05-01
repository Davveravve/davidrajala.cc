import { SectionLabel } from "@/components/ui/section-label";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { parseList } from "@/lib/queries";
import type { AboutMe } from "@prisma/client";

export function AboutSnippet({ about }: { about: AboutMe }) {
  const skills = parseList(about.skills);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid-fine opacity-30" aria-hidden />
      <div className="container-page relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <SectionLabel className="mb-6">About</SectionLabel>
            <Reveal>
              <h2 className="font-display text-4xl md:text-6xl font-medium tracking-tight text-balance">
                Experienced developer. <br />
                <span className="text-[var(--color-fg-muted)]">
                  Detail-obsessed designer.
                </span>
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-7 lg:pt-4">
            <Reveal delay={0.2}>
              <p className="text-lg md:text-xl text-[var(--color-fg-muted)] leading-relaxed text-pretty">
                {about.bio}
              </p>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="mt-10">
                <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-dim)] mb-4">
                  Stack
                </div>
                <ul className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <li
                      key={s}
                      className="px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-fg-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.5}>
              <div className="mt-10">
                <Button href="/om-mig" variant="ghost" arrow>
                  More about me
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
