"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChatButton } from "@/components/chat/chat-button";
import type { AboutMe } from "@prisma/client";

export function Hero({ about }: { about: AboutMe }) {
  const hasBg = !!about.heroBgUrl;
  const isVideo = about.heroBgType === "video";

  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden pt-32 pb-24">
      {hasBg && (
        <div className="absolute inset-0">
          {isVideo ? (
            <video
              src={about.heroBgUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={about.heroBgUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(5,6,8,0.55) 0%, rgba(5,6,8,0.7) 50%, rgba(5,6,8,1) 100%)",
            }}
            aria-hidden
          />
        </div>
      )}
      {!hasBg && (
        <>
          <div className="absolute inset-0 bg-grid" aria-hidden />
          <div className="absolute inset-0 bg-radial-fade" aria-hidden />
        </>
      )}

      <div className="container-page relative z-10">
        <div className="max-w-5xl">
          <AvailabilityBadge
            available={about.available}
            busyMessage={about.busyMessage}
          />

          <h1 className="font-display text-[clamp(3rem,10vw,9rem)] leading-[0.9] tracking-tight font-medium text-balance mt-10">
            <AnimatedHeading>{about.name}</AnimatedHeading>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 max-w-2xl text-lg md:text-xl text-[var(--color-fg-muted)] leading-relaxed text-pretty"
          >
            Building digital products with a focus on{" "}
            <span className="text-[var(--color-fg)]">usability</span>{" "}
            and{" "}
            <span className="text-[var(--color-fg)]">modern tech</span>.
            Based in {about.location}.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 flex flex-wrap gap-3"
          >
            <Button href="/projekt" arrow>
              View work
            </Button>
            <ChatButton variant="outline">Contact me</ChatButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl"
          >
            <Stat label="YEARS EXPERIENCE" value={`${about.yearsExp}+`} />
            <Stat label="PROJECTS DELIVERED" value={`${about.projectsDone}+`} />
            <Stat label="HAPPY CLIENTS" value={`${about.clients}+`} />
          </motion.div>
        </div>
      </div>

    </section>
  );
}

function AvailabilityBadge({
  available,
  busyMessage,
}: {
  available: boolean;
  busyMessage: string;
}) {
  const dotColor = available ? "var(--color-accent)" : "rgb(249 115 22)";
  const text = available
    ? "Available for new projects"
    : busyMessage || "Currently working on projects — there might be a wait";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex items-center gap-3 rounded-full border border-[var(--color-border)] glass px-4 py-2 text-[11px] uppercase tracking-[0.12em] font-medium"
    >
      <span className="relative inline-flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
          style={{ background: dotColor }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ background: dotColor }}
        />
      </span>
      <span className="text-[var(--color-fg-muted)]">{text}</span>
    </motion.div>
  );
}

function AnimatedHeading({ children }: { children: string }) {
  const words = children.split(" ");
  return (
    <span className="inline-block">
      {words.map((w, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap mr-[0.2em]">
          {Array.from(w).map((ch, ci) => (
            <motion.span
              key={ci}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.2 + wi * 0.1 + ci * 0.03,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block"
            >
              {ch}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-[var(--color-border)] pl-5">
      <div className="font-display text-3xl md:text-4xl font-medium tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
        {label}
      </div>
    </div>
  );
}
