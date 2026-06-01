"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpenCheck, Menu, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  AppNavbarAccount,
  AppNavbarMobileAccount,
  AppNavbarUserLinks,
} from "./AppNavbarAuth";

export type AppNavbarUser = {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
};

const NAV_ITEMS = [
  { href: "/learn", label: "Learn" },
  { href: "/learn/lessons", label: "Lessons" },
  { href: "/learn/vocabulary", label: "Vocabulary" },
  { href: "/news", label: "News" },
] as const;

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/88 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition group-hover:-rotate-2 group-hover:scale-105">
              <BookOpenCheck className="size-5" />
            </span>
            <span className="text-lg font-semibold">Engleet</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} pathname={pathname}>
                {item.label}
              </NavLink>
            ))}
            <AppNavbarUserLinks />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <AppNavbarAccount />
          </div>
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="focus-ring inline-flex size-10 items-center justify-center rounded-lg border bg-card/80 text-foreground shadow-sm transition hover:border-primary/35 hover:bg-muted md:hidden"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t bg-background/95 px-4 py-3 shadow-lg shadow-primary/5 backdrop-blur-xl md:hidden">
          <nav className="mx-auto grid max-w-6xl gap-2">
            {NAV_ITEMS.map((item) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                pathname={pathname}
                onNavigate={() => setIsMenuOpen(false)}
              >
                {item.label}
              </MobileNavLink>
            ))}
            <div className="mt-1 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Select English text anywhere to open the quick lookup.
            </div>
            <AppNavbarMobileAccount onNavigate={() => setIsMenuOpen(false)} />
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string;
  children: React.ReactNode;
}) {
  const active = isNavItemActive(href, pathname);

  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  pathname,
  children,
  onNavigate,
}: {
  href: string;
  pathname: string;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  const active = isNavItemActive(href, pathname);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "rounded-lg px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function isNavItemActive(href: string, pathname: string) {
  if (href === "/learn") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
