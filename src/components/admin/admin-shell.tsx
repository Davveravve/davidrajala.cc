"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  Tag,
  User,
  LogOut,
  Mail,
  ExternalLink,
  Menu,
  X,
  Settings as SettingsIcon,
  Layout,
  Image as ImageIcon,
  Activity,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/site-editor", label: "Site", icon: Layout },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/about", label: "About", icon: User },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.replace("/admin/login");
    router.refresh();
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <header
        className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-[var(--color-bg-elevated)]/80 backdrop-blur-md border-b border-[var(--color-border)]"
            : "bg-transparent"
        }`}
      >
        <div className="container-page max-w-7xl flex items-center justify-between gap-4 py-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[12px] uppercase tracking-[0.1em] font-medium flex-shrink-0"
          >
            <span className="relative inline-flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            </span>
            <span>Admin</span>
            <span className="text-[var(--color-fg-dim)]">/</span>
            <span className="text-[var(--color-fg-muted)] hidden sm:inline">DR Portfolio</span>
          </Link>

          <nav className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center gap-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/40 backdrop-blur-md px-1.5 py-1.5">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative px-3.5 py-1.5 text-sm font-medium transition-colors"
                  >
                    {active && (
                      <motion.span
                        layoutId="admin-nav-active"
                        className="absolute inset-0 rounded-full bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/35"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span
                      className={`relative flex items-center gap-2 ${
                        active
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                      }`}
                    >
                      <Icon size={13} />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/"
              target="_blank"
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-colors"
              title="View public site"
            >
              <ExternalLink size={13} />
              <span className="hidden xl:inline">View site</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign out"
            >
              <LogOut size={13} />
              <span className="hidden xl:inline">Sign out</span>
            </button>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)]"
            >
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden absolute top-full left-4 right-4 mt-2 glass-strong rounded-2xl border border-[var(--color-border)] p-4 z-30 shadow-2xl"
            >
              <nav className="flex flex-col gap-1 mb-3">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                        active
                          ? "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)]"
                          : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]"
                      }`}
                    >
                      <Icon size={14} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-[var(--color-border)] pt-3 flex flex-col gap-1">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <ExternalLink size={14} />
                  View public site
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
                <div className="px-4 pt-2 text-[10px] text-[var(--color-fg-dim)] truncate">
                  {email}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
