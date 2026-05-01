"use client";

import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { useChat } from "@/components/chat/chat-context";

export function ContactCta() {
  const { setOpen } = useChat();

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container-page">
        <Reveal>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative block w-full text-left rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-16 lg:p-20 overflow-hidden hover:border-[var(--color-accent)] transition-all duration-500"
          >
            <div className="absolute inset-0 bg-grid opacity-30 group-hover:opacity-60 transition-opacity" aria-hidden />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(0,229,255,0.1), transparent 60%)",
              }}
              aria-hidden
            />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="max-w-3xl">
                <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-6 flex items-center gap-3">
                  <span className="h-px w-8 bg-[var(--color-accent)]" />
                  Get in touch
                </div>
                <h2 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-balance leading-[0.95]">
                  Got a project
                  <br />
                  <span className="text-[var(--color-accent)]">in mind?</span>
                </h2>
                <p className="mt-6 text-lg text-[var(--color-fg-muted)] max-w-lg">
                  Open the chat and tell me about your project. I&apos;ll get back to you as soon as I can.
                </p>
              </div>

              <span className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-fg-muted)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)] group-hover:bg-[var(--color-accent)]/5 group-hover:rotate-45 transition-all duration-500 flex-shrink-0">
                <ArrowUpRight size={18} />
              </span>
            </div>
          </button>
        </Reveal>
      </div>
    </section>
  );
}
