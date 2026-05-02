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

export async function getRecentProjects(exclude?: string | string[] | null) {
  const excludeIds = Array.isArray(exclude)
    ? exclude.filter(Boolean)
    : exclude
      ? [exclude]
      : [];
  return prisma.project.findMany({
    where: {
      published: true,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
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
  let rows = await prisma.homeSection.findMany({
    orderBy: { order: "asc" },
    include: { project: { include: { category: true, images: { orderBy: { order: "asc" }, take: 1 } } } },
  });
  if (rows.length === 0) {
    // First-run lazy seed: one row per default type.
    await prisma.$transaction(
      HOME_SECTION_TYPES.map((type, idx) =>
        prisma.homeSection.create({ data: { type, order: idx } }),
      ),
    );
    rows = await prisma.homeSection.findMany({
      orderBy: { order: "asc" },
      include: { project: { include: { category: true, images: { orderBy: { order: "asc" }, take: 1 } } } },
    });
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
