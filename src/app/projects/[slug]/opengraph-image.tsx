import { ImageResponse } from "next/og";
import { getProjectBySlug } from "@/lib/queries";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://davidrajala.cc";

// Auto-generated Open Graph image per project.
// Resolves to e.g. /projects/sci-fi-test/opengraph-image so social shares
// always look polished without manually creating preview cards.
export default async function ProjectOgImage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await getProjectBySlug(params.slug);

  // Fallback if project not found
  const title = project?.title ?? "David Rajala";
  const summary =
    project?.summary ?? "Full Stack Developer based in Gothenburg.";
  const category = project?.category?.name ?? "PROJECT";
  const coverAbs = project?.coverUrl
    ? new URL(project.coverUrl, SITE_URL).toString()
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#050608",
          color: "#fafbfc",
          padding: "60px",
          position: "relative",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {coverAbs && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverAbs}
              alt=""
              width={1200}
              height={630}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.4,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(5,6,8,0.65) 0%, rgba(5,6,8,0.95) 100%)",
              }}
            />
          </>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 18,
            letterSpacing: 4,
            color: "#00e5ff",
            textTransform: "uppercase",
            position: "relative",
          }}
        >
          <div
            style={{ width: 32, height: 2, background: "#00e5ff" }}
          />
          {category}
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                fontSize: 80,
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: -2,
                maxWidth: 1080,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 28,
                color: "#8b94a3",
                lineHeight: 1.3,
                maxWidth: 900,
              }}
            >
              {summary.length > 160 ? summary.slice(0, 157) + "..." : summary}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            fontSize: 18,
            color: "#8b94a3",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#00e5ff",
              }}
            />
            DR / davidrajala.cc
          </div>
          <div>Full Stack Developer</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
