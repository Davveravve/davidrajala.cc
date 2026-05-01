import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScrollProgress } from "@/components/scroll-progress";
import { ChatProvider } from "@/components/chat/chat-context";
import { ChatPanel } from "@/components/chat/chat-panel";
import { getAboutMe } from "@/lib/queries";
import "./globals.css";

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
  const about = await getAboutMe();

  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        <ChatProvider>
          <ScrollProgress />
          <SiteHeader />
          <main className="relative">{children}</main>
          <SiteFooter
            about={{
              email: about.email,
              phone: about.phone,
              location: about.location,
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
