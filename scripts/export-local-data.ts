/**
 * Export the entire content database to a JSON file. Run on the local laptop:
 *   npx tsx scripts/export-local-data.ts
 *
 * Produces data-export.json which can be SCP:d to the server and imported.
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();

async function main() {
  const [categories, projects, about, settings] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.project.findMany({
      orderBy: { order: "asc" },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    prisma.aboutMe.findUnique({ where: { id: "singleton" } }),
    prisma.notificationSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    categories,
    projects,
    about,
    settings,
  };

  writeFileSync("data-export.json", JSON.stringify(payload, null, 2));

  console.log(
    `✓ Exported ${categories.length} categories, ${projects.length} projects, about-me, settings → data-export.json`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
