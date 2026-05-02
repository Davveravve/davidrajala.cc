"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaLightbox, type LightboxItem } from "@/components/media-lightbox";
import { Reveal } from "@/components/ui/reveal";

type GalleryItem = {
  id: string;
  url: string;
  alt: string;
  caption: string;
};

export function GalleryGrid({ images }: { images: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const lightboxItems: LightboxItem[] = images.map((img) => ({
    id: img.id,
    url: img.url,
    alt: img.alt,
  }));

  return (
    <section className="container-page pb-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[minmax(200px,auto)] md:auto-rows-[260px]">
        {images.map((img, i) => {
          const wide = i % 4 === 0;
          return (
            <Reveal
              key={img.id}
              delay={Math.min(i * 0.04, 0.4)}
              className={wide ? "md:col-span-2" : "md:col-span-1"}
            >
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                className="group relative block h-full w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors duration-300 hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/30"
                aria-label={img.alt || img.caption || "Open image"}
              >
                <div className="relative h-full w-full min-h-[240px] md:min-h-0">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes={
                      wide
                        ? "(min-width: 768px) 66vw, 100vw"
                        : "(min-width: 768px) 33vw, 100vw"
                    }
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized={img.url.startsWith("/uploads/")}
                  />
                  {/* gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/10 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                  {/* hover scan line */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {(img.caption || img.alt) && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      {img.caption && (
                        <p className="text-sm text-[var(--color-fg)] leading-snug line-clamp-2">
                          {img.caption}
                        </p>
                      )}
                      {img.alt && img.alt !== img.caption && (
                        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)]">
                          {img.alt}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>

      <MediaLightbox
        items={lightboxItems}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNavigate={(i) => setActiveIndex(i)}
      />
    </section>
  );
}
