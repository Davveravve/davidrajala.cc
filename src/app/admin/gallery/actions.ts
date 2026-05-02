"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
import { saveUploadedFile, deleteUpload, isLocalUpload } from "@/lib/uploads";

function revalidate() {
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
}

export async function addGalleryImages(formData: FormData) {
  await ensureAdmin();

  const files = formData.getAll("galleryFiles") as File[];
  if (!files.length) {
    revalidate();
    return;
  }

  const last = await prisma.galleryImage.aggregate({ _max: { order: true } });
  let nextOrder = (last._max.order ?? -1) + 1;

  for (const f of files) {
    if (!f || f.size === 0) continue;
    const url = await saveUploadedFile(f, "gallery-standalone");
    await prisma.galleryImage.create({
      data: { url, order: nextOrder++ },
    });
  }

  revalidate();
}

export async function updateGalleryImage(
  id: string,
  alt: string,
  caption: string,
) {
  await ensureAdmin();

  await prisma.galleryImage.update({
    where: { id },
    data: {
      alt: alt.slice(0, 300),
      caption: caption.slice(0, 500),
    },
  });

  revalidate();
}

export async function reorderGalleryImages(orderedIds: string[]) {
  await ensureAdmin();

  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.galleryImage.update({ where: { id }, data: { order: idx } }),
    ),
  );

  revalidate();
}

export async function deleteGalleryImage(id: string) {
  await ensureAdmin();

  const img = await prisma.galleryImage.findUnique({ where: { id } });
  if (!img) return;

  if (isLocalUpload(img.url)) {
    await deleteUpload(img.url);
  }

  await prisma.galleryImage.delete({ where: { id } });

  revalidate();
}
