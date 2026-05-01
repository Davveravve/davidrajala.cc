/**
 * Import data-export.json into the active database. Run on the SERVER after
 * SCP:ing data-export.json to the project root:
 *   npx tsx scripts/import-data.ts
 *
 * Replaces all categories, projects and project images. Updates AboutMe
 * (preserves existing telegram settings unless export contains values).
 * Never touches AdminUser — the server's own admin password / 2FA stay intact.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";

const prisma = new PrismaClient();

type Img = { id: string; url: string; alt: string; order: number };
type Cat = { id: string; name: string; slug: string; order: number };
type Proj = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  coverUrl: string;
  liveUrl: string | null;
  repoUrl: string | null;
  techStack: string;
  order: number;
  featured: boolean;
  published: boolean;
  categoryId: string | null;
  images: Img[];
};
type About = Record<string, unknown> | null;
type Settings = {
  telegramEnabled: boolean;
  telegramToken: string;
  telegramChatId: string;
} | null;

async function main() {
  const path = process.argv[2] ?? "data-export.json";
  if (!existsSync(path)) {
    throw new Error(`${path} not found. Run export-local-data.ts first and SCP the file here.`);
  }
  const raw = readFileSync(path, "utf-8");
  const data = JSON.parse(raw) as {
    categories: Cat[];
    projects: Proj[];
    about: About;
    settings: Settings;
  };

  console.log(
    `Importing ${data.categories.length} categories, ${data.projects.length} projects…`,
  );

  // Wipe existing content (but not AdminUser, ContactMessage, NotificationSettings)
  await prisma.projectImage.deleteMany();
  await prisma.project.deleteMany();
  await prisma.category.deleteMany();

  // Categories first (FK dependency)
  for (const c of data.categories) {
    await prisma.category.create({
      data: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        order: c.order,
      },
    });
  }

  // Projects + their images
  for (const p of data.projects) {
    await prisma.project.create({
      data: {
        id: p.id,
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        body: p.body,
        coverUrl: p.coverUrl,
        liveUrl: p.liveUrl,
        repoUrl: p.repoUrl,
        techStack: p.techStack,
        order: p.order,
        featured: p.featured,
        published: p.published,
        categoryId: p.categoryId,
        images: {
          create: p.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            order: img.order,
          })),
        },
      },
    });
  }

  // About — overwrite scalars but preserve telegram settings if local export is empty
  if (data.about) {
    const cleaned: Record<string, unknown> = { ...data.about };
    // remove fields prisma manages
    delete cleaned.updatedAt;
    delete cleaned.createdAt;

    const existing = await prisma.aboutMe.findUnique({ where: { id: "singleton" } });
    await prisma.aboutMe.upsert({
      where: { id: "singleton" },
      create: { ...(cleaned as Record<string, never>) },
      update: { ...(cleaned as Record<string, never>) },
    });
    void existing;
  }

  // Notifications — only override if exported version actually has token/chatId
  if (data.settings && (data.settings.telegramToken || data.settings.telegramChatId)) {
    await prisma.notificationSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        telegramEnabled: data.settings.telegramEnabled,
        telegramToken: data.settings.telegramToken,
        telegramChatId: data.settings.telegramChatId,
      },
      update: {
        telegramEnabled: data.settings.telegramEnabled,
        telegramToken: data.settings.telegramToken,
        telegramChatId: data.settings.telegramChatId,
      },
    });
  }

  console.log("✓ Import complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
