import Image from "next/image";
import { getAboutMe, parseList } from "@/lib/queries";
import { SectionLabel } from "@/components/ui/section-label";
import { Reveal } from "@/components/ui/reveal";
import { ArrowUpRight } from "lucide-react";
import { ChatButton } from "@/components/chat/chat-button";

export const metadata = {
  title: "About — David Rajala",
  description: "Get to know me, my background, and how I work.",
};

export default async function AboutPage() {
  const about = await getAboutMe();
  const skills = parseList(about.skills);

  return (
    <>
      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-fine" aria-hidden />
        <div className="absolute inset-0 bg-radial-fade" aria-hidden />
        <div className="container-page relative">
          <SectionLabel className="mb-6">Get to know me</SectionLabel>
          <Reveal>
            <h1 className="font-display text-4xl sm:text-5xl md:text-8xl font-medium tracking-tight text-balance leading-[0.95]">
              About me
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="relative py-16">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <Reveal>
                <div className="relative rounded-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] aspect-square max-w-md">
                  {about.avatarUrl && (
                    <Image
                      src={about.avatarUrl}
                      alt={about.name}
                      fill
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)]/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: about.available ? "var(--color-accent)" : "rgb(249 115 22)",
                          boxShadow: about.available
                            ? "0 0 8px var(--color-accent)"
                            : "0 0 8px rgb(249 115 22 / 0.6)",
                        }}
                      />
                      <span
                        className="text-[10px] uppercase tracking-[0.12em] font-medium"
                        style={{
                          color: about.available ? "var(--color-accent)" : "rgb(251 146 60)",
                        }}
                      >
                        {about.available ? "Available" : "Busy"}
                      </span>
                    </div>
                    <div className="font-display text-2xl font-medium">{about.name}</div>
                    <div className="text-sm text-[var(--color-fg-muted)]">{about.role}</div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                  <Stat label="YEARS EXPERIENCE" value={`${about.yearsExp}+`} />
                  <Stat label="PROJECTS" value={`${about.projectsDone}+`} />
                  <Stat label="CLIENTS" value={`${about.clients}+`} />
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <Reveal delay={0.1}>
                <p className="text-xl md:text-2xl text-[var(--color-fg)] leading-relaxed mb-10 text-pretty">
                  {about.bio}
                </p>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-4 flex items-center gap-3">
                  <span className="h-px w-6 bg-[var(--color-fg-dim)]" />
                  Direct contact
                </div>
                <ul className="border-t border-[var(--color-border)] mb-12">
                  {about.email && (
                    <ContactRow
                      label="Email"
                      value={about.email}
                      href={`mailto:${about.email}`}
                    />
                  )}
                  {about.phone && (
                    <ContactRow
                      label="Phone"
                      value={about.phone}
                      href={`tel:${about.phone.replace(/\s/g, "")}`}
                    />
                  )}
                  {about.location && (
                    <ContactRow label="Location" value={about.location} />
                  )}
                </ul>
              </Reveal>

              {skills.length > 0 && (
                <Reveal delay={0.3}>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-4 flex items-center gap-3">
                      <span className="h-px w-6 bg-[var(--color-fg-dim)]" />
                      Skills
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
              )}

              <Reveal delay={0.4}>
                <div className="mt-12">
                  <ChatButton>Let&apos;s talk</ChatButton>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-[var(--color-border)] pl-4">
      <div className="font-display text-2xl md:text-3xl font-medium tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] leading-tight">
        {label}
      </div>
    </div>
  );
}

function ContactRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="group flex items-center justify-between gap-4 py-4 border-b border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-colors">
      <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] w-20 flex-shrink-0">
        {label}
      </div>
      <div className="flex-1 text-base md:text-[17px] font-medium truncate group-hover:text-[var(--color-accent)] transition-colors">
        {value}
      </div>
      {href && (
        <ArrowUpRight
          size={16}
          className="text-[var(--color-fg-dim)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0"
        />
      )}
    </div>
  );
  if (href) return <li><a href={href}>{inner}</a></li>;
  return <li>{inner}</li>;
}
