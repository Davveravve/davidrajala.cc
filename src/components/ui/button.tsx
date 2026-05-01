import Link from "next/link";
import { cn } from "@/lib/cn";
import { ArrowUpRight } from "lucide-react";

type Variant = "primary" | "ghost" | "outline";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-bg)] hover:shadow-[0_0_30px_var(--color-accent-glow)]",
  ghost:
    "bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  outline:
    "bg-transparent text-[var(--color-fg)] border border-[var(--color-border-strong)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
};

type Props = {
  href?: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  arrow?: boolean;
  external?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

export function Button({
  href,
  variant = "primary",
  className,
  children,
  arrow,
  external,
  onClick,
  type = "button",
}: Props) {
  const base =
    "group relative inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all overflow-hidden";

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {arrow && (
        <ArrowUpRight
          size={16}
          className="relative z-10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={cn(base, VARIANTS[variant], className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(base, VARIANTS[variant], className)}
    >
      {content}
    </button>
  );
}
