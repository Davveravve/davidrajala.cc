"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { isVideoUrl } from "@/lib/media";

export type LightboxItem = {
  id: string;
  url: string;
  alt?: string;
};

export function MediaLightbox({
  items,
  activeIndex,
  onClose,
  onNavigate,
}: {
  items: LightboxItem[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const isOpen = activeIndex !== null;

  const goPrev = useCallback(() => {
    if (activeIndex === null || items.length === 0) return;
    onNavigate((activeIndex - 1 + items.length) % items.length);
  }, [activeIndex, items.length, onNavigate]);

  const goNext = useCallback(() => {
    if (activeIndex === null || items.length === 0) return;
    onNavigate((activeIndex + 1) % items.length);
  }, [activeIndex, items.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, goPrev, goNext]);

  const current = activeIndex !== null ? items[activeIndex] : null;
  const hasMany = items.length > 1;

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Media viewer"
        >
          <div
            className="absolute inset-0 bg-[var(--color-bg)]/95 backdrop-blur-md"
            onClick={onClose}
            aria-hidden
          />

          {/* close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* counter */}
          {hasMany && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-[var(--color-surface)]/60 backdrop-blur-sm border border-[var(--color-border)] text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] tabular-nums">
              {activeIndex + 1} / {items.length}
            </div>
          )}

          {/* prev */}
          {hasMany && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* next */}
          {hasMany && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* media */}
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideoUrl(current.url) ? (
              <video
                src={current.url}
                controls
                autoPlay
                loop
                playsInline
                className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl"
              />
            ) : (
              <Image
                src={current.url}
                alt={current.alt ?? ""}
                width={2400}
                height={1600}
                priority
                sizes="92vw"
                className="max-w-[92vw] max-h-[88vh] w-auto h-auto object-contain rounded-xl"
                unoptimized={current.url.startsWith("/uploads/")}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
