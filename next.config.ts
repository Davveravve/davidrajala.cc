import type { NextConfig } from "next";
import path from "path";

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "imgur.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "120mb",
    },
  },
  async redirects() {
    return [
      { source: "/projekt", destination: "/projects", permanent: true },
      { source: "/projekt/:slug", destination: "/projects/:slug", permanent: true },
      { source: "/om-mig", destination: "/about", permanent: true },
      { source: "/admin/projekt", destination: "/admin/projects", permanent: true },
      { source: "/admin/projekt/nytt", destination: "/admin/projects/new", permanent: true },
      { source: "/admin/projekt/:id", destination: "/admin/projects/:id", permanent: true },
      { source: "/admin/om-mig", destination: "/admin/about", permanent: true },
      { source: "/admin/kategorier", destination: "/admin/categories", permanent: true },
      { source: "/admin/meddelanden", destination: "/admin/messages", permanent: true },
      { source: "/admin/installningar", destination: "/admin/settings", permanent: true },
    ];
  },
};

export default config;
