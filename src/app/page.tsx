import { Hero } from "@/components/sections/hero";
import { FeaturedHighlight } from "@/components/sections/featured-highlight";
import { LatestProjects } from "@/components/sections/latest-projects";
import { AboutSnippet } from "@/components/sections/about-snippet";
import { ContactCta } from "@/components/sections/contact-cta";
import {
  getAboutMe,
  getFeaturedProject,
  getRecentProjects,
  getHomeSections,
  getSiteSettings,
} from "@/lib/queries";

export default async function HomePage() {
  const [about, sections, settings] = await Promise.all([
    getAboutMe(),
    getHomeSections(),
    getSiteSettings(),
  ]);

  // Featured sections each render a specific project (section.project).
  // Older configs without a projectId fall back to the legacy globally-starred
  // project so existing setups don't go blank after the schema change.
  const featuredFallback =
    sections.some((s) => s.type === "featured" && s.visible && !s.projectId)
      ? await getFeaturedProject()
      : null;

  const featuredIds = sections
    .filter((s) => s.type === "featured" && s.projectId)
    .map((s) => s.projectId!)
    .concat(featuredFallback ? [featuredFallback.id] : []);
  const recent = await getRecentProjects(featuredIds);

  const visible = sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {visible.map((s) => {
        switch (s.type) {
          case "hero":
            return <Hero key={s.id} about={about} config={s} settings={settings} />;
          case "featured": {
            const project = s.project ?? featuredFallback;
            return project ? (
              <FeaturedHighlight key={s.id} project={project} config={s} />
            ) : null;
          }
          case "latest":
            return <LatestProjects key={s.id} projects={recent} config={s} />;
          case "about":
            return <AboutSnippet key={s.id} about={about} config={s} />;
          case "contact":
            return <ContactCta key={s.id} config={s} />;
          default:
            return null;
        }
      })}
    </>
  );
}
