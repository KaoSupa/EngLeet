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
    return <div className="h-10 w-28 animate-pulse rounded-lg border bg-muted/60" />;
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
        className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
      >
        Sign up
      </Link>
    </div>
  );
}

export function AppNavbarMobileAccount({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  const user = useNavbarUser();

  if (user === undefined) {
    return <div className="mt-1 h-20 animate-pulse rounded-lg border bg-muted/60" />;
  }

  if (user) {
    return (
      <div className="mt-1 grid gap-2 border-t pt-3">
        <div className="rounded-lg bg-card px-3 py-2">
          <p className="truncate text-sm font-medium">{user.displayName}</p>
          {user.email && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          )}
        </div>
        <NavLink href="/dashboard" onNavigate={onNavigate}>
          Dashboard
        </NavLink>
        <NavLink href="/learn/vocabulary" onNavigate={onNavigate}>
          Vocabulary
        </NavLink>
        {user.role === "admin" && (
          <NavLink href="/admin" onNavigate={onNavigate}>
            Admin
          </NavLink>
        )}
      </div>
    );
  }

  return (
    <div className="mt-1 grid grid-cols-2 gap-2 border-t pt-3">
      <Link
        href="/login"
        onClick={onNavigate}
        className="rounded-lg border bg-card px-3 py-2 text-center text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        Login
      </Link>
      <Link
        href="/register"
        onClick={onNavigate}
        className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90"
      >
        Sign up
      </Link>
    </div>
  );
}

function NavLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
