import { cn } from "@/lib/cn";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)]",
        className,
      )}
    >
      <span className="h-px w-8 bg-[var(--color-accent)]" />
      {children}
    </div>
  );
}
