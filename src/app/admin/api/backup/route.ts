import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";

export async function GET() {
  await ensureAdmin();

  const [
    adminUsers,
    categories,
    projects,
    projectImages,
    aboutMe,
    contactMessages,
    contactDetails,
    notificationSettings,
    homeSections,
    siteSettings,
    galleryImages,
  ] = await Promise.all([
    prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        // explicitly omit passwordHash + totpSecret
      },
    }),
    prisma.category.findMany(),
    prisma.project.findMany(),
    prisma.projectImage.findMany(),
    prisma.aboutMe.findMany(),
    prisma.contactMessage.findMany(),
    prisma.contactDetail.findMany(),
    prisma.notificationSettings.findMany(),
    prisma.homeSection.findMany(),
    prisma.siteSettings.findMany(),
    prisma.galleryImage.findMany(),
  ]);

  const exportedAt = new Date().toISOString();
  const payload = {
    exportedAt,
    version: 1,
    data: {
      adminUsers,
      categories,
      projects,
      projectImages,
      aboutMe,
      contactMessages,
      contactDetails,
      notificationSettings,
      homeSections,
      siteSettings,
      galleryImages,
    },
  };

  const filename = `portfolio-backup-${exportedAt.slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
