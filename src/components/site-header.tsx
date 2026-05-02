"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User as UserIcon, LogIn } from "lucide-react";
import { useChat } from "@/components/chat/chat-context";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/store", label: "Store" },
];

export function SiteHeader({
  customer,
}: {
  customer: { name: string; email: string } | null;
}) {
  const pathname = usePathname();
  const { setOpen: setChatOpen, open: chatOpen } = useChat();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  const isContactActive = chatOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-6"
      }`}
    >
      <div className="container-page flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2 text-[12px] uppercase tracking-[0.1em] font-medium"
        >
          <span className="relative inline-flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
          </span>
          <span className="text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors">
            DR
          </span>
          <span className="text-[var(--color-fg-dim)]">/</span>
          <span className="text-[var(--color-fg-muted)] hidden sm:inline">
            Portfolio
          </span>
        </Link>

        <nav className="hidden md:flex">
          <div
            className={`flex items-center gap-1 rounded-full border border-[var(--color-border)] px-1.5 py-1.5 transition-all ${
              scrolled ? "glass-strong" : "glass"
            }`}
          >
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 text-sm font-medium transition-colors"
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/35"
                      style={{
                        boxShadow:
                          "inset 0 0 14px rgba(var(--color-accent-rgb), 0.08), 0 0 0 1px rgba(var(--color-accent-rgb), 0.05)",
                      }}
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
                    {active && (
                      <motion.span
                        layoutId="nav-dot"
                        className="h-1 w-1 rounded-full bg-[var(--color-accent)]"
                        style={{ boxShadow: "0 0 8px var(--color-accent)" }}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {customer ? (
              <Link
                href="/store/account"
                className="relative ml-1 inline-flex items-center gap-2 pl-3 pr-4 py-2 text-sm font-medium rounded-full transition-colors text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)]"
                title={customer.email}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[11px] font-semibold">
                  {(customer.name || customer.email)[0].toUpperCase()}
                </span>
                <span className="hidden sm:inline">
                  {customer.name || customer.email.split("@")[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/store/login"
                className="relative ml-1 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)]"
              >
                <LogIn size={13} />
                Sign in
              </Link>
            )}

            <button
              type="button"
              onClick={() => setChatOpen(true)}
              aria-current={isContactActive ? "page" : undefined}
              className={`relative ml-1 px-4 py-2 text-sm font-medium rounded-full transition-all bg-[var(--color-accent)] text-[var(--color-bg)] ${
                isContactActive
                  ? "shadow-[0_0_24px_var(--color-accent-glow)]"
                  : "hover:shadow-[0_0_24px_var(--color-accent-glow)]"
              }`}
            >
              {isContactActive && (
                <span className="absolute -inset-px rounded-full ring-1 ring-[var(--color-accent)]/40 ring-offset-2 ring-offset-[var(--color-bg-elevated)] pointer-events-none" />
              )}
              Contact
            </button>
          </div>
        </nav>

        <button
          aria-label="Open menu"
          onClick={() => setOpen(!open)}
          className="md:hidden glass rounded-full p-3 border border-[var(--color-border)]"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-4 right-4 mt-2 glass-strong rounded-2xl border border-[var(--color-border)] p-4"
          >
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      active
                        ? "bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/30 text-[var(--color-accent)]"
                        : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
                    }`}
                  >
                    {active && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
                        style={{ boxShadow: "0 0 8px var(--color-accent)" }}
                      />
                    )}
                    {item.label}
                  </Link>
                );
              })}
              {customer ? (
                <Link
                  href="/store/account"
                  className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-xs font-semibold">
                    {(customer.name || customer.email)[0].toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {customer.name || customer.email.split("@")[0]}
                    </div>
                    <div className="text-[10px] text-[var(--color-fg-muted)] truncate">
                      {customer.email}
                    </div>
                  </div>
                  <UserIcon size={14} className="text-[var(--color-fg-muted)]" />
                </Link>
              ) : (
                <Link
                  href="/store/login"
                  className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <LogIn size={14} className="text-[var(--color-fg-muted)]" />
                  <span className="text-sm font-medium">Sign in</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setChatOpen(true);
                }}
                aria-current={isContactActive ? "page" : undefined}
                className={`mt-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-center ${
                  isContactActive ? "ring-2 ring-[var(--color-accent)]/40 ring-offset-2 ring-offset-[var(--color-bg-elevated)]" : ""
                }`}
              >
                Contact
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
