"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function TopLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // On admin pages: render nothing.
  const onAdmin = pathname?.startsWith("/admin") ?? false;

  // Listen for clicks on internal links/forms — start showing the bar.
  useEffect(() => {
    if (onAdmin) return;

    const start = () => {
      setLoading(true);
      setProgress(15);
    };

    const onClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const a = target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (a.target === "_blank") return;
      if (a.hasAttribute("download")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
      // Resolve any href (relative or absolute) against the current URL so we
      // can check origin + pathname uniformly.
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same pathname (with or without hash) → no navigation, don't show the
      // bar. This covers Home → Home, Sign in → Sign in, and #anchors.
      if (url.pathname === window.location.pathname) return;
      start();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [onAdmin]);

  // Tick progress upwards while loading.
  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        // Asymptotic approach to 90%.
        const delta = (90 - p) * 0.08;
        return p + Math.max(0.5, delta);
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [loading]);

  // Pathname change → finish.
  useEffect(() => {
    if (!loading) return;
    setProgress(100);
    const t = window.setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 220);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (onAdmin) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px]"
    >
      <div
        className="h-full bg-[var(--color-accent)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: loading ? 1 : 0,
          boxShadow:
            "0 0 10px var(--color-accent-glow), 0 0 4px var(--color-accent)",
        }}
      />
    </div>
  );
}
