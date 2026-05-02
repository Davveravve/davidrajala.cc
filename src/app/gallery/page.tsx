import { prisma } from "@/lib/prisma";
import { SectionLabel } from "@/components/ui/section-label";
import { Reveal } from "@/components/ui/reveal";
import { GalleryGrid } from "@/components/sections/gallery-grid";

export const metadata = {
  title: "Gallery — David Rajala",
  description: "Visual notes — a curated selection of photographs and stills.",
};

export default async function GalleryPage() {
  const images = await prisma.galleryImage.findMany({
    orderBy: { order: "asc" },
  });

  const count = images.length;

  return (
    <>
      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-fine opacity-40" aria-hidden />
        <div className="absolute inset-0 bg-radial-fade" aria-hidden />
        <div className="container-page relative">
          <SectionLabel className="mb-6">Photography</SectionLabel>
          <Reveal>
            <h1 className="font-display text-4xl sm:text-5xl md:text-8xl font-medium tracking-tight text-balance leading-[0.95]">
              Visual <br />
              <span className="text-[var(--color-fg-muted)]">notes.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 text-lg text-[var(--color-fg-muted)] max-w-2xl">
              {count === 0
                ? "A space for stills, frames and visual experiments — coming soon."
                : `${count} ${count === 1 ? "frame" : "frames"} — moments, textures and details collected along the way.`}
            </p>
          </Reveal>
        </div>
      </section>

      {count === 0 ? (
        <section className="container-page pb-24">
          <Reveal>
            <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/40 p-16 text-center">
              <div className="font-display text-2xl mb-2">Nothing here yet</div>
              <p className="text-sm text-[var(--color-fg-muted)] max-w-md mx-auto">
                Check back later — visual notes will start appearing here once the first frames are added.
              </p>
            </div>
          </Reveal>
        </section>
      ) : (
        <GalleryGrid
          images={images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            caption: img.caption,
          }))}
        />
      )}
    </>
  );
}
