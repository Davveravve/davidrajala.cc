import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-grid" aria-hidden />
      <div className="absolute inset-0 bg-radial-fade" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 0%, var(--color-bg) 75%)",
        }}
      />

      <div className="container-page relative text-center">
        <div className="text-[11px] uppercase tracking-[0.18em] font-medium text-[var(--color-accent)] mb-6">
          Error 404
        </div>

        <h1
          className="font-display font-medium tracking-tight text-balance leading-none glitch-404"
          style={{ fontSize: "clamp(7rem, 22vw, 18rem)" }}
        >
          404
        </h1>

        <p className="mt-8 text-xl md:text-2xl text-[var(--color-fg)] text-balance">
          This page slipped between the cracks.
        </p>
        <p className="mt-3 text-base text-[var(--color-fg-muted)] text-balance max-w-md mx-auto">
          It might have moved, been deleted, or never existed at all.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button href="/" variant="primary" arrow>
            Back home
          </Button>
          <Button href="/projects" variant="ghost" arrow>
            View work
          </Button>
        </div>
      </div>
    </div>
  );
}
