"use client";

import { useState } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { MediaLightbox, type LightboxItem } from "@/components/media-lightbox";
import { isVideoUrl } from "@/lib/media";
import { Maximize2, Play } from "lucide-react";

type Item = { id: string; url: string; alt: string };

export function ProjectGallery({
  images,
  projectTitle,
}: {
  images: Item[];
  projectTitle: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const lightboxItems: LightboxItem[] = images.map((img) => ({
    id: img.id,
    url: img.url,
    alt: img.alt || projectTitle,
  }));

  return (
    <>
      {/* masonry — each item keeps its natural aspect ratio */}
      <div className="columns-1 sm:columns-2 gap-5 [column-fill:_balance]">
        {images.map((img, i) => {
          const video = isVideoUrl(img.url);
          return (
            <Reveal key={img.id} delay={i * 0.04} className="break-inside-avoid mb-5">
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                className="group relative block w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-colors"
              >
                {video ? (
                  <video
                    src={img.url}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="block w-full h-auto"
                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : (
                  // plain <img> so the natural aspect ratio is preserved without
                  // needing intrinsic dimensions stored in the DB
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={img.alt || projectTitle}
                    loading="lazy"
                    className="block w-full h-auto transition-transform duration-700 group-hover:scale-[1.015]"
                  />
                )}

                {/* hover affordance */}
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--color-bg)]/0 group-hover:bg-[var(--color-bg)]/30 transition-colors">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_30px_var(--color-accent-glow)]">
                    {video ? <Play size={16} fill="currentColor" /> : <Maximize2 size={15} />}
                  </span>
                </span>

                {video && (
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] uppercase tracking-wider">
                    Video
                  </span>
                )}
              </button>
            </Reveal>
          );
        })}
      </div>

      <MediaLightbox
        items={lightboxItems}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNavigate={setActiveIndex}
      />
    </>
  );
}

// Cover image variant — clickable hero cover that opens its own single-item lightbox.
export function ProjectCover({
  url,
  alt,
}: {
  url: string;
  alt: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full max-w-[860px] mx-auto aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-colors"
      >
        <Image
          src={url}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 860px, (min-width: 768px) 80vw, 100vw"
          className="object-contain transition-transform duration-700 group-hover:scale-[1.015]"
        />
        <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)]/80 backdrop-blur-sm border border-[var(--color-border)] text-[var(--color-fg-muted)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)] transition-colors">
          <Maximize2 size={13} />
        </span>
      </button>

      <MediaLightbox
        items={[{ id: "cover", url, alt }]}
        activeIndex={open ? 0 : null}
        onClose={() => setOpen(false)}
        onNavigate={() => {}}
      />
    </>
  );
}
