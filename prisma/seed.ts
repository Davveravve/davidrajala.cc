import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@portfolio.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // In dev we want password login to "just work" again after re-seeding,
  // so we explicitly clear any previously-set 2FA secret. Set up 2FA again
  // manually from /admin/setup-2fa whenever you want.
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, totpSecret: null },
    create: { email: adminEmail, passwordHash, totpSecret: null },
  });
  console.log(`✓ Admin user: ${adminEmail} (2FA cleared)`);

  const categories = [
    { name: "Web", slug: "web", order: 0 },
    { name: "App", slug: "app", order: 1 },
    { name: "3D", slug: "3d", order: 2 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✓ Categories seeded`);

  const web = await prisma.category.findUnique({ where: { slug: "web" } });
  const app = await prisma.category.findUnique({ where: { slug: "app" } });
  const threeD = await prisma.category.findUnique({ where: { slug: "3d" } });

  const projects = [
    {
      slug: "halsoapp",
      title: "Hälsoapp",
      summary: "Hälsoapp för att tracka kalorier & vikt.",
      body:
        "En komplett hälsoapp byggd för att hjälpa användare att enkelt logga sin kost, " +
        "vikt och dagliga aktivitet. Inkluderar visualiseringar för makros, " +
        "kalorimål och progressionsgrafer.\n\nByggd med React Native + Firebase.",
      coverUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
      techStack: "React Native,Firebase,TypeScript,Expo",
      categoryId: app?.id ?? null,
      featured: true,
      order: 0,
    },
    {
      slug: "relicrush-gg",
      title: "RelicRush.gg",
      summary:
        "Ett fullständigt fungerande crypto casino byggt som demo/koncept. Sidan innehåller flera spellägen: Roulette med Royal-tema.",
      body:
        "RelicRush.gg är ett fullt fungerande crypto-casino byggt som koncept. " +
        "Inkluderar flera spellägen — roulette, blackjack, dice — alla med animationer " +
        "i realtid och provably-fair logik.\n\nFrontend: React + Vite. Backend: Node.js + Socket.IO. " +
        "State synkroniseras live mellan spelare.",
      coverUrl:
        "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=1200&q=80",
      liveUrl: "https://relicrush.gg",
      techStack: "React,Node.js,Socket.IO,PostgreSQL,Tailwind",
      categoryId: web?.id ?? null,
      featured: true,
      order: 1,
    },
    {
      slug: "closet-remake",
      title: "Closet Remake",
      summary:
        "Ett koncept jag tog fram för att visualisera en garderob jag ville bygga. Jag använde exakta mått för att skapa en detaljerad...",
      body:
        "Ett 3D-koncept jag tog fram för att visualisera en garderob jag ville bygga in hemma. " +
        "Med exakta mått, materialval och belysning kunde jag iterera designen i timmar " +
        "innan en enda spik slogs in.\n\nGjord i Blender, renderad med Cycles.",
      coverUrl:
        "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=1200&q=80",
      techStack: "Blender,Cycles",
      categoryId: threeD?.id ?? null,
      featured: true,
      order: 2,
    },
    {
      slug: "axento",
      title: "Axento",
      summary:
        "Axento är en plattform jag utvecklade för att hålla koll på material i min servicebil.",
      body:
        "Axento är en plattform jag utvecklade för att hålla koll på material och verktyg " +
        "i min servicebil. Lager, beställningar och förbrukning på ett ställe — synkat mellan " +
        "telefonen och webben.\n\nByggd med Next.js + Supabase.",
      coverUrl:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
      techStack: "Next.js,Supabase,Tailwind,TypeScript",
      categoryId: web?.id ?? null,
      featured: false,
      order: 3,
    },
  ];

  for (const proj of projects) {
    await prisma.project.upsert({
      where: { slug: proj.slug },
      update: proj,
      create: proj,
    });
  }
  console.log(`✓ ${projects.length} projects seeded`);

  await prisma.aboutMe.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      name: "David Rajala",
      role: "Full Stack Developer",
      avatarUrl: "https://i.imgur.com/mgqGHlV.jpeg",
      bio:
        "Jag är en Full Stack-utvecklare baserad i Göteborg. Med över 5 års " +
        "erfarenhet av att skapa digitala lösningar fokuserar jag på att bygga " +
        "moderna webbapplikationer som är både funktionella och användarvänliga.",
      location: "Göteborg, Sverige",
      email: "davidjohanssonrajala@gmail.com",
      phone: "+46 72 304 02 96",
      yearsExp: 5,
      projectsDone: 11,
      clients: 6,
      skills: "React,React Native,Node.js,JavaScript,TypeScript,Firebase,Supabase,Next.js,PostgreSQL",
      available: true,
      busyMessage: "Currently working on projects — there might be a wait",
    },
  });
  console.log(`✓ About-me seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
