import Link from "next/link";
import UserMenu from "./UserMenu";

export type AppNavbarUser = {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
};

export default function AppNavbar({ user }: { user: AppNavbarUser }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/dashboard" className="shrink-0 text-lg font-semibold">
            Engleet
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/learn">Learn</NavLink>
          </nav>
        </div>

        <UserMenu
          displayName={user.displayName}
          email={user.email}
          avatarUrl={user.avatarUrl}
        />
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
