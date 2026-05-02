import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScrollProgress } from "@/components/scroll-progress";
import { TopLoadingBar } from "@/components/top-loading-bar";
import { ChatProvider } from "@/components/chat/chat-context";
import { ChatPanel } from "@/components/chat/chat-panel";
import { CustomerToaster } from "@/components/notifications/customer-toaster";
import { getAboutMe, getSiteSettings } from "@/lib/queries";
import { getCurrentCustomer } from "@/lib/customer-auth";
import "./globals.css";

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://davidrajala.cc";

export const metadata: Metadata = {
  title: {
    default: "David Rajala — Full Stack Developer",
    template: "%s — David Rajala",
  },
  description:
    "Full Stack Developer based in Gothenburg. Building modern digital products focused on usability and forward-thinking tech.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  applicationName: "David Rajala",
  authors: [{ name: "David Rajala", url: SITE_URL }],
  creator: "David Rajala",
  keywords: [
    "David Rajala",
    "Full Stack Developer",
    "Web Developer",
    "Next.js",
    "React",
    "Node.js",
    "3D",
    "Blender",
    "Unreal Engine",
    "Gothenburg",
    "Sweden",
    "Portfolio",
  ],
  openGraph: {
    title: "David Rajala — Full Stack Developer",
    description:
      "Full Stack Developer based in Gothenburg. Building modern digital products focused on usability and forward-thinking tech.",
    url: SITE_URL,
    siteName: "David Rajala",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "David Rajala — Full Stack Developer",
    description:
      "Full Stack Developer based in Gothenburg.",
    creator: "@davidrajala",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [about, settings, customer] = await Promise.all([
    getAboutMe(),
    getSiteSettings(),
    getCurrentCustomer(),
  ]);
  const headerCustomer = customer
    ? { name: customer.name, email: customer.email }
    : null;

  const rgb = hexToRgb(settings.accentColor) ?? { r: 0, g: 229, b: 255 };
  const themeStyle = `:root{--color-accent:${settings.accentColor};--color-accent-rgb:${rgb.r}, ${rgb.g}, ${rgb.b};--color-accent-glow:rgba(${rgb.r},${rgb.g},${rgb.b},0.35);--color-accent-2:${settings.accentColor2};}`;

  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} data-scroll-behavior="smooth">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      </head>
      <body className="antialiased">
        <ChatProvider>
          <ScrollProgress />
          <TopLoadingBar />
          <CustomerToaster signedIn={!!customer} />
          <SiteHeader customer={headerCustomer} />
          <main className="relative" style={{ viewTransitionName: "page" }}>
            {children}
          </main>
          <SiteFooter
            about={{
              email: about.email,
              phone: about.phone,
              location: about.location,
              ownerName: about.name,
            }}
            settings={{
              tagline: settings.footerTagline,
              copyright: settings.footerCopyright,
              statusText: settings.footerStatusText,
            }}
          />
          <ChatPanel
            avatarUrl={about.avatarUrl}
            ownerName={about.name}
            available={about.available}
            customer={
              customer
                ? {
                    name: customer.name,
                    email: customer.email,
                    twitter: customer.twitter,
                    github: customer.github,
                    linkedin: customer.linkedin,
                    website: customer.website,
                  }
                : null
            }
          />
        </ChatProvider>
      </body>
    </html>
  );
}
