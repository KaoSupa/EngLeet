import Link from "next/link";
import {
  AppNavbarAccount,
  AppNavbarUserLinks,
} from "./AppNavbarAuth";

export type AppNavbarUser = {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
};

export default function AppNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0 text-lg font-semibold">
            Engleet
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/learn">Learn</NavLink>
            <NavLink href="/learn/lessons">Lessons</NavLink>
            <NavLink href="/learn/vocabulary">Vocabulary</NavLink>
            <NavLink href="/news">News</NavLink>
            <AppNavbarUserLinks />
          </nav>
        </div>

        <AppNavbarAccount />
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
