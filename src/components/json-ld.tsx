// Server component — emits JSON-LD structured data so Google understands
// the site (Person + Website + per-project CreativeWork). No client JS.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://davidrajala.cc";

export function PersonJsonLd({
  name,
  role,
  bio,
  email,
  location,
  avatarUrl,
}: {
  name: string;
  role: string;
  bio: string;
  email: string;
  location: string;
  avatarUrl: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle: role,
    description: bio,
    url: SITE_URL,
    image: avatarUrl ? new URL(avatarUrl, SITE_URL).toString() : undefined,
    email: email || undefined,
    address: location
      ? {
          "@type": "PostalAddress",
          addressLocality: location,
        }
      : undefined,
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebsiteJsonLd({ name }: { name: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: SITE_URL,
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ProjectJsonLd({
  title,
  summary,
  slug,
  coverUrl,
  authorName,
  datePublished,
  dateModified,
}: {
  title: string;
  summary: string;
  slug: string;
  coverUrl: string;
  authorName: string;
  datePublished: Date | string;
  dateModified: Date | string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    headline: title,
    description: summary,
    url: `${SITE_URL}/projects/${slug}`,
    image: coverUrl ? new URL(coverUrl, SITE_URL).toString() : undefined,
    author: {
      "@type": "Person",
      name: authorName,
      url: SITE_URL,
    },
    datePublished: new Date(datePublished).toISOString(),
    dateModified: new Date(dateModified).toISOString(),
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
