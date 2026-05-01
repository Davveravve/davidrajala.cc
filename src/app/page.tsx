import { Hero } from "@/components/sections/hero";
import { FeaturedHighlight } from "@/components/sections/featured-highlight";
import { LatestProjects } from "@/components/sections/latest-projects";
import { AboutSnippet } from "@/components/sections/about-snippet";
import { ContactCta } from "@/components/sections/contact-cta";
import { getAboutMe, getFeaturedProject, getRecentProjects } from "@/lib/queries";

export default async function HomePage() {
  const [featured, about] = await Promise.all([
    getFeaturedProject(),
    getAboutMe(),
  ]);
  const recent = await getRecentProjects(featured?.id ?? null);

  return (
    <>
      <Hero about={about} />
      {featured && <FeaturedHighlight project={featured} />}
      <LatestProjects projects={recent} />
      <AboutSnippet about={about} />
      <ContactCta />
    </>
  );
}
