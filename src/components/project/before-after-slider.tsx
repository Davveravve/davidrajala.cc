"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  before: string;
  after: string;
  alt?: string;
};

export function BeforeAfterSlider({ before, after, alt = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // percentage (0-100) of "after" visible from left
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, ratio)));
  }, []);

  // Mouse
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      updateFromClientX(e.clientX);
    };
    const handleUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [updateFromClientX]);

  // Touch
  useEffect(() => {
    const handleMove = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      const t = e.touches[0];
      if (t) updateFromClientX(t.clientX);
    };
    const handleEnd = () => {
      draggingRef.current = false;
    };
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);
    return () => {
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, [updateFromClientX]);

  const onMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true;
    updateFromClientX(e.clientX);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    draggingRef.current = true;
    const t = e.touches[0];
    if (t) updateFromClientX(t.clientX);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className="relative w-full max-w-[860px] mx-auto aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] select-none cursor-ew-resize touch-none"
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
      aria-label="Before/after comparison slider"
    >
      {/* After image (full, underneath) */}
      <Image
        src={after}
        alt={alt ? `${alt} — after` : "After"}
        fill
        sizes="100vw"
        className="object-cover pointer-events-none"
        priority={false}
      />

      {/* Before image, clipped from right so it shows on the left side */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image
          src={before}
          alt={alt ? `${alt} — before` : "Before"}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-[var(--color-bg)]/70 backdrop-blur-sm text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg)] border border-[var(--color-border)] pointer-events-none">
        Before
      </span>
      <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-[var(--color-bg)]/70 backdrop-blur-sm text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg)] border border-[var(--color-border)] pointer-events-none">
        After
      </span>

      {/* Vertical handle line */}
      <div
        className="absolute top-0 bottom-0 w-px bg-[var(--color-accent)] pointer-events-none shadow-[0_0_12px_var(--color-accent-glow)]"
        style={{ left: `${pos}%` }}
      />

      {/* Circular handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-accent)] shadow-[0_0_24px_var(--color-accent-glow)] pointer-events-none"
        style={{ left: `${pos}%` }}
      >
        <span className="flex items-center gap-0.5 text-[var(--color-accent)]">
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden>
            <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden>
            <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}
