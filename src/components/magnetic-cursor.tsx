"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";

export function MagneticCursor() {
  const pathname = usePathname();

  // Hide on touch / coarse-pointer devices and on admin routes.
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  // Detect hover capability once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: none)");
    const update = () => setEnabled(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const onAdmin = pathname?.startsWith("/admin") ?? false;
  const active = enabled && !onAdmin;

  useEffect(() => {
    if (!active) return;

    // Hide the OS cursor while the magnetic cursor is active.
    const prev = document.body.style.cursor;
    document.body.style.cursor = "none";

    const isInteractive = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest(
          "a, button, [role='button'], [data-magnetic], input, textarea, select, label",
        ),
      );
    };

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const onOver = (e: MouseEvent) => {
      if (isInteractive(e.target)) setHovering(true);
    };

    const onOut = (e: MouseEvent) => {
      if (isInteractive(e.target)) setHovering(false);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      document.body.style.cursor = prev;
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [active, visible, x, y]);

  if (!active) return null;

  return (
    <motion.div
      aria-hidden
      style={{
        translateX: sx,
        translateY: sy,
      }}
      className="pointer-events-none fixed left-0 top-0 z-[200]"
    >
      <motion.div
        animate={{
          width: hovering ? 32 : 8,
          height: hovering ? 32 : 8,
          backgroundColor: hovering
            ? "rgba(0,0,0,0)"
            : "var(--color-accent)",
          borderColor: "var(--color-accent)",
          borderWidth: hovering ? 1.5 : 0,
          opacity: visible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        style={{
          translateX: "-50%",
          translateY: "-50%",
          boxShadow: hovering
            ? "0 0 16px var(--color-accent-glow)"
            : "0 0 8px var(--color-accent-glow)",
        }}
        className="rounded-full"
      />
    </motion.div>
  );
}
