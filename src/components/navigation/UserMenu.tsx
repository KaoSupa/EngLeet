"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  BookOpen,
  Shield,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

type UserMenuProps = {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
};

export default function UserMenu({
  displayName,
  email,
  avatarUrl,
  role,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-lg border bg-background px-2 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted bg-cover bg-center text-xs font-semibold text-muted-foreground"
          style={
            avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined
          }
          aria-hidden="true"
        >
          {!avatarUrl && initial}
        </span>
        <span className="hidden max-w-32 truncate sm:block">{displayName}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="border-b px-4 py-3">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {email && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {email}
              </p>
            )}
          </div>

          <nav className="p-1">
            <MenuLink href="/dashboard" icon={LayoutDashboard}>
              Dashboard
            </MenuLink>
            <MenuLink href="/learn/vocabulary" icon={BookOpen}>
              Vocabulary
            </MenuLink>
            {role === "admin" && (
              <MenuLink href="/admin" icon={Shield}>
                Admin
              </MenuLink>
            )}
          </nav>

          <form action="/auth/logout" method="post" className="border-t p-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      {children}
    </Link>
  );
}
