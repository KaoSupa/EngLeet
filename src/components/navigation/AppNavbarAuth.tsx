"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import UserMenu from "./UserMenu";
import type { AppNavbarUser } from "./AppNavbar";

let cachedNavbarUser: AppNavbarUser | null | undefined;
let pendingNavbarUser: Promise<AppNavbarUser | null> | null = null;

async function fetchNavbarUser() {
  if (cachedNavbarUser !== undefined) {
    return cachedNavbarUser;
  }

  pendingNavbarUser ??= fetch("/api/auth/navbar", {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as {
        user?: AppNavbarUser | null;
      };

      return payload.user ?? null;
    })
    .catch(() => null)
    .then((user) => {
      cachedNavbarUser = user;
      return user;
    });

  return pendingNavbarUser;
}

function useNavbarUser() {
  const [user, setUser] = useState<AppNavbarUser | null | undefined>(
    cachedNavbarUser,
  );

  useEffect(() => {
    let active = true;

    fetchNavbarUser().then((nextUser) => {
      if (active) {
        setUser(nextUser);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return user;
}

export function AppNavbarUserLinks() {
  const user = useNavbarUser();

  if (!user) {
    return null;
  }

  return (
    <>
      <NavLink href="/dashboard">Dashboard</NavLink>
      {user.role === "admin" && <NavLink href="/admin">Admin</NavLink>}
    </>
  );
}

export function AppNavbarAccount() {
  const user = useNavbarUser();

  if (user === undefined) {
    return <div className="h-10 w-28 rounded-lg border bg-muted/50" />;
  }

  if (user) {
    return (
      <UserMenu
        displayName={user.displayName}
        email={user.email}
        avatarUrl={user.avatarUrl}
        role={user.role}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Sign up
      </Link>
    </div>
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
