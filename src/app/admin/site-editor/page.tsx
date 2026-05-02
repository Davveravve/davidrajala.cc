import { getHomeSections, getSiteSettings } from "@/lib/queries";
import { SiteEditor } from "@/components/admin/site-editor";

export const metadata = {
  title: "Site editor — Admin",
};

export default async function SiteEditorPage() {
  const [sections, settings] = await Promise.all([
    getHomeSections(),
    getSiteSettings(),
  ]);

  return (
    <div className="container-page max-w-7xl py-8 md:py-12">
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3 flex items-center gap-2">
          <span className="h-px w-6 bg-[var(--color-accent)]" />
          Site
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Site editor
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)] max-w-2xl">
          Toggle home page sections, reorder them, edit copy, change accent color and footer text.
          All changes go live instantly.
        </p>
      </div>

      <SiteEditor sections={sections} settings={settings} />
    </div>
  );
}
