import { prisma } from "@/lib/prisma";
import { CategoriesEditor } from "@/components/admin/categories-editor";

export default async function AdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Manage
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">Categories</h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          Use categories to group projects on the portfolio page.
        </p>
      </div>

      <CategoriesEditor
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: c._count.projects,
        }))}
      />
    </div>
  );
}
