"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatButton } from "@/components/chat/chat-button";

type FooterAbout = {
  email: string;
  phone: string;
  location: string;
};

export function SiteFooter({ about }: { about: FooterAbout }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="relative border-t border-[var(--color-border)] mt-32">
      <div className="container-page py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-3">
              <span className="h-px w-6 bg-[var(--color-accent)]" />
              David Rajala
            </div>
            <p className="text-[var(--color-fg-muted)] text-sm leading-relaxed max-w-sm">
              Full Stack Developer based in {about.location || "Gothenburg"}.
              Building digital products that feel as good as they look.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-4">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm hover:text-[var(--color-accent)] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-sm hover:text-[var(--color-accent)] transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm hover:text-[var(--color-accent)] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <ChatButton variant="raw" className="text-sm hover:text-[var(--color-accent)] transition-colors">
                  Contact
                </ChatButton>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-4">
              Get in touch
            </h4>
            <ul className="space-y-2">
              {about.email && (
                <li>
                  <a
                    href={`mailto:${about.email}`}
                    className="text-sm hover:text-[var(--color-accent)] transition-colors"
                  >
                    {about.email}
                  </a>
                </li>
              )}
              {about.phone && (
                <li>
                  <a
                    href={`tel:${about.phone.replace(/\s/g, "")}`}
                    className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {about.phone}
                  </a>
                </li>
              )}
              {about.location && (
                <li className="text-sm text-[var(--color-fg-muted)]">
                  {about.location}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row gap-4 justify-between items-start md:items-center text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--color-fg-dim)]">
          <span>© {new Date().getFullYear()} David Rajala. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] pulse-dot" />
            SYSTEM ONLINE
          </span>
        </div>
      </div>
    </footer>
  );
}
