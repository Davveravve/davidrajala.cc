import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="absolute inset-0 bg-radial-fade" aria-hidden />
      <div className="container-page relative text-center">
        <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-accent)] mb-4">
          Error 404
        </div>
        <h1 className="font-display text-7xl md:text-9xl font-medium tracking-tight text-balance">
          Nothing here.
        </h1>
        <p className="mt-6 text-lg text-[var(--color-fg-muted)]">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors group"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          Home
        </Link>
      </div>
    </div>
  );
}
