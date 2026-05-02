import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/ui/reveal";
import { CommentSection } from "@/components/comments/comment-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const img = await prisma.galleryImage.findUnique({ where: { id } });
  if (!img) return {};
  return {
    title: img.caption || img.alt || "Gallery — David Rajala",
    description: img.caption || img.alt,
    openGraph: {
      images: img.url ? [img.url] : [],
    },
  };
}

export default async function GalleryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [image, all] = await Promise.all([
    prisma.galleryImage.findUnique({ where: { id } }),
    prisma.galleryImage.findMany({
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    }),
  ]);
  if (!image) notFound();

  const idx = all.findIndex((x) => x.id === image.id);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <article className="relative">
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-fine opacity-30" aria-hidden />
        <div className="container-page relative">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-10 group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            Back to gallery
          </Link>

          <Reveal>
            <div className="relative aspect-[16/10] rounded-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
              <Image
                src={image.url}
                alt={image.alt || image.caption || ""}
                fill
                priority
                sizes="(min-width: 1024px) 80vw, 100vw"
                className="object-contain"
              />
            </div>
          </Reveal>

          {(image.caption || image.alt) && (
            <Reveal delay={0.1}>
              <div className="mt-8 max-w-2xl">
                {image.caption && (
                  <p className="font-display text-2xl md:text-3xl font-medium tracking-tight text-balance">
                    {image.caption}
                  </p>
                )}
                {image.alt && image.alt !== image.caption && (
                  <p className="mt-3 text-sm text-[var(--color-fg-muted)] leading-relaxed">
                    {image.alt}
                  </p>
                )}
              </div>
            </Reveal>
          )}

          <nav className="mt-10 flex items-center justify-between gap-4">
            {prev ? (
              <Link
                href={`/gallery/${prev.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] text-sm transition-colors"
              >
                <ArrowLeft size={14} />
                Previous
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/gallery/${next.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] text-sm transition-colors"
              >
                Next
                <ArrowRight size={14} />
              </Link>
            )}
          </nav>
        </div>
      </section>

      <section className="relative pt-8">
        <CommentSection parentType="gallery" parentId={image.id} />
      </section>
    </article>
  );
}
