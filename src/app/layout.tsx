import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScrollProgress } from "@/components/scroll-progress";
import { TopLoadingBar } from "@/components/top-loading-bar";
import { ChatProvider } from "@/components/chat/chat-context";
import { ChatPanel } from "@/components/chat/chat-panel";
import { getAboutMe, getSiteSettings } from "@/lib/queries";
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

export const metadata: Metadata = {
  title: "David Rajala — Full Stack Developer",
  description:
    "Full Stack Developer based in Gothenburg. Building modern digital solutions focused on usability and forward-thinking tech.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "David Rajala — Full Stack Developer",
    description:
      "Building modern digital solutions focused on usability and tech.",
    type: "website",
    locale: "en",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [about, settings] = await Promise.all([getAboutMe(), getSiteSettings()]);

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
          <SiteHeader />
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
          />
        </ChatProvider>
      </body>
    </html>
  );
}
