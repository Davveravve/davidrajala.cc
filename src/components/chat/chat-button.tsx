"use client";

import { useChat } from "./chat-context";
import { cn } from "@/lib/cn";

export function ChatButton({
  children,
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "ghost" | "outline" | "raw";
}) {
  const { setOpen } = useChat();

  if (variant === "raw") {
    return (
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
    );
  }

  const variants = {
    primary:
      "bg-[var(--color-accent)] text-[var(--color-bg)] hover:shadow-[0_0_30px_var(--color-accent-glow)]",
    ghost:
      "bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
    outline:
      "bg-transparent text-[var(--color-fg)] border border-[var(--color-border-strong)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  };

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "group relative inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all overflow-hidden",
        variants[variant],
        className,
      )}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}
