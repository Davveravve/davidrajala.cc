import { prisma } from "@/lib/prisma";
import { GalleryAdmin } from "@/components/admin/gallery-admin";

export default async function AdminGalleryPage() {
  const images = await prisma.galleryImage.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="container-page max-w-7xl py-8 md:py-12">
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Manage
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Gallery
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          Upload, reorder and annotate the standalone visual gallery. Drag to
          reorder. Alt and caption save on blur.
        </p>
      </div>

      <GalleryAdmin
        images={images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          caption: img.caption,
        }))}
      />
    </div>
  );
}
