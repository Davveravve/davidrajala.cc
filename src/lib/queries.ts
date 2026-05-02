import { prisma } from "./prisma";

export async function getFeaturedProject() {
  return prisma.project.findFirst({
    where: { featured: true, published: true },
    include: {
      category: true,
      images: { orderBy: { order: "asc" }, take: 1 },
    },
  });
}

export async function getRecentProjects(excludeId?: string | null) {
  return prisma.project.findMany({
    where: {
      published: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: { category: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    take: 6,
  });
}

export async function getAllProjects() {
  return prisma.project.findMany({
    where: { published: true },
    include: { category: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug, published: true },
    include: {
      category: true,
      images: { orderBy: { order: "asc" } },
    },
  });
}

export async function getAllProjectSlugs() {
  return prisma.project.findMany({
    where: { published: true },
    select: { slug: true },
  });
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { order: "asc" },
  });
}

export async function getAboutMe() {
  return prisma.aboutMe.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export const HOME_SECTION_TYPES = [
  "hero",
  "featured",
  "latest",
  "about",
  "contact",
] as const;

export type HomeSectionType = (typeof HOME_SECTION_TYPES)[number];

export async function getHomeSections() {
  let rows = await prisma.homeSection.findMany({ orderBy: { order: "asc" } });
  if (rows.length < HOME_SECTION_TYPES.length) {
    // Lazy-seed any missing rows. Race-safe: each `type` is unique, so
    // upsert no-ops if another request already created it.
    await Promise.all(
      HOME_SECTION_TYPES.map((type, idx) =>
        prisma.homeSection.upsert({
          where: { type },
          update: {},
          create: { type, order: idx },
        }),
      ),
    );
    rows = await prisma.homeSection.findMany({ orderBy: { order: "asc" } });
  }
  return rows;
}

export async function getSiteSettings() {
  return prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export function parseList(s: string): string[] {
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
