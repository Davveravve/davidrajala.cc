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
  let about = await prisma.aboutMe.findUnique({ where: { id: "singleton" } });
  if (!about) {
    about = await prisma.aboutMe.create({ data: { id: "singleton" } });
  }
  return about;
}

export function parseList(s: string): string[] {
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
