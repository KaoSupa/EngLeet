import { describe, expect, it } from "vitest";

import {
  ADMIN_AUTH_REDIRECT,
  DEFAULT_AUTH_REDIRECT,
  getDefaultRedirectForRole,
  getPostAuthRedirect,
  getSafeRedirectPath,
} from "./redirect";

describe("auth redirect helpers", () => {
  it("returns role-aware default destinations", () => {
    expect(getDefaultRedirectForRole("admin")).toBe(ADMIN_AUTH_REDIRECT);
    expect(getDefaultRedirectForRole("user")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(getDefaultRedirectForRole(null)).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it("allows only internal relative redirect paths", () => {
    expect(getSafeRedirectPath("/learn?level=A1#start")).toBe(
      "/learn?level=A1#start",
    );
    expect(getSafeRedirectPath("https://evil.example/dashboard")).toBe(
      DEFAULT_AUTH_REDIRECT,
    );
    expect(getSafeRedirectPath("//evil.example/dashboard")).toBe(
      DEFAULT_AUTH_REDIRECT,
    );
    expect(getSafeRedirectPath("dashboard")).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it("sends admins away from the user dashboard after auth", () => {
    expect(getPostAuthRedirect("/dashboard", "admin")).toBe(
      ADMIN_AUTH_REDIRECT,
    );
    expect(getPostAuthRedirect("/dashboard/stats", "admin")).toBe(
      ADMIN_AUTH_REDIRECT,
    );
    expect(getPostAuthRedirect("/admin", "admin")).toBe(ADMIN_AUTH_REDIRECT);
  });

  it("keeps non-admin users on safe requested destinations", () => {
    expect(getPostAuthRedirect("/dashboard", "user")).toBe(
      DEFAULT_AUTH_REDIRECT,
    );
    expect(getPostAuthRedirect("/learn/vocabulary", "user")).toBe(
      "/learn/vocabulary",
    );
    expect(getPostAuthRedirect("//evil.example", "user")).toBe(
      DEFAULT_AUTH_REDIRECT,
    );
  });
});
