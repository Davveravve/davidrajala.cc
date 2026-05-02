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
  "store-featured",
  "about",
  "contact",
] as const;

export type HomeSectionType = (typeof HOME_SECTION_TYPES)[number];

export async function getHomeSections() {
  const include = {
    project: {
      include: {
        category: true,
        images: { orderBy: { order: "asc" as const }, take: 1 },
      },
    },
    storeProduct: true,
  };
  let rows = await prisma.homeSection.findMany({
    orderBy: { order: "asc" },
    include,
  });
  if (rows.length === 0) {
    // First-run lazy seed: one row per default type. The store-featured
    // type is seeded but hidden by default — the owner enables it from
    // the site editor and picks a product.
    await prisma.$transaction(
      HOME_SECTION_TYPES.map((type, idx) =>
        prisma.homeSection.create({
          data: {
            type,
            order: idx,
            visible: type !== "store-featured",
          },
        }),
      ),
    );
    rows = await prisma.homeSection.findMany({
      orderBy: { order: "asc" },
      include,
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
