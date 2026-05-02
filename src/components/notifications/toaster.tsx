"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCircle2, AlertTriangle } from "lucide-react";

export type ToastVariant = "default" | "success" | "warn";

export type Toast = {
  id: string;
  title: string;
  body: string;
  href?: string;
  variant?: ToastVariant;
  createdAt: number;
};

export type PushToastInput = Omit<Toast, "id" | "createdAt"> & {
  id?: string;
  createdAt?: number;
};

type ToasterCtx = {
  toasts: Toast[];
  push: (t: PushToastInput) => string;
  dismiss: (id: string) => void;
};

const Ctx = createContext<ToasterCtx | null>(null);

const AUTO_DISMISS_MS = 8000;

/**
 * Wrap any subtree that should be able to push toasts via `useToaster()`.
 * Render `<Toaster />` somewhere inside this subtree to actually display
 * the stack — provider just owns the queue + API.
 */
export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((input: PushToastInput) => {
    const id =
      input.id ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const toast: Toast = {
      id,
      title: input.title,
      body: input.body,
      href: input.href,
      variant: input.variant ?? "default",
      createdAt: input.createdAt ?? Date.now(),
    };
    setToasts((prev) => {
      // De-dupe by id — callers may push the same notification on each poll.
      if (prev.some((t) => t.id === id)) return prev;
      // Cap the stack to keep things sane.
      const next = [...prev, toast];
      return next.length > 5 ? next.slice(next.length - 5) : next;
    });
    return id;
  }, []);

  const value = useMemo<ToasterCtx>(
    () => ({ toasts, push, dismiss }),
    [toasts, push, dismiss],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useToaster() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToaster must be used inside <ToasterProvider>");
  return ctx;
}

/**
 * Mount component — renders the fixed bottom-right stack. Must live inside
 * a `<ToasterProvider>`. Safe to render multiple times (only the first
 * matters visually, but the provider state is shared).
 */
export function Toaster() {
  const { toasts, dismiss } = useToaster();

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[90] flex w-full max-w-sm flex-col gap-3"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss after AUTO_DISMISS_MS unless hovered. Restarts when hover ends.
  useEffect(() => {
    if (hovered) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hovered, onDismiss]);

  const variant = toast.variant ?? "default";
  const accentClass =
    variant === "success"
      ? "border-[var(--color-accent)]/45 shadow-[0_0_30px_var(--color-accent-glow)]"
      : variant === "warn"
      ? "border-orange-500/45 shadow-[0_0_30px_rgba(249,115,22,0.28)]"
      : "border-[var(--color-border-strong)] shadow-[0_8px_30px_rgba(0,0,0,0.45)]";

  const Icon =
    variant === "success" ? CheckCircle2 : variant === "warn" ? AlertTriangle : Bell;
  const iconClass =
    variant === "success"
      ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10"
      : variant === "warn"
      ? "text-orange-400 bg-orange-500/10"
      : "text-[var(--color-fg-muted)] bg-[var(--color-surface-2)]";

  function handleClick() {
    if (toast.href) {
      router.push(toast.href);
    }
    onDismiss();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (toast.href && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 32, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${accentClass} glass-strong backdrop-blur-md`}
    >
      <div
        role={toast.href ? "button" : undefined}
        tabIndex={toast.href ? 0 : -1}
        onClick={toast.href ? handleClick : undefined}
        onKeyDown={toast.href ? handleKey : undefined}
        className={`flex items-start gap-3 p-3.5 pr-9 ${
          toast.href ? "cursor-pointer" : ""
        }`}
      >
        <span
          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${iconClass}`}
          aria-hidden
        >
          <Icon size={13} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium leading-snug text-[var(--color-fg)]">
            {toast.title}
          </div>
          {toast.body && (
            <div className="mt-0.5 truncate text-[12px] leading-snug text-[var(--color-fg-muted)]">
              {toast.body}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Dismiss notification"
        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-fg-dim)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}
