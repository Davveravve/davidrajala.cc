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
  const [featured, about, sections, settings] = await Promise.all([
    getFeaturedProject(),
    getAboutMe(),
    getHomeSections(),
    getSiteSettings(),
  ]);
  const recent = await getRecentProjects(featured?.id ?? null);

  const visible = sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {visible.map((s) => {
        switch (s.type) {
          case "hero":
            return <Hero key={s.id} about={about} config={s} settings={settings} />;
          case "featured":
            return featured ? (
              <FeaturedHighlight key={s.id} project={featured} config={s} />
            ) : null;
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
