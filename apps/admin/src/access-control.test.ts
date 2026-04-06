import { describe, expect, it } from "vitest";

import { resolveAdminRouteAccess } from "./session.js";

describe("resolveAdminRouteAccess", () => {
  it("grants access when the session user has role admin", () => {
    const result = resolveAdminRouteAccess({
      accessToken: "admin-token",
      user: {
        uuid: "admin-user-uuid",
        email: "user@example.com",
        role: "admin",
        status: "active",
      },
    });

    expect(result).toEqual({
      kind: "granted",
      user: {
        uuid: "admin-user-uuid",
        email: "user@example.com",
        role: "admin",
        status: "active",
      },
    });
  });

  it("denies access for an authenticated user without admin role", () => {
    const result = resolveAdminRouteAccess({
      accessToken: "user-token",
      user: {
        uuid: "regular-user-uuid",
        email: "user@example.com",
        role: "user",
        status: "active",
      },
    });

    expect(result).toEqual({
      kind: "denied",
    });
  });

  it("redirects to login when there is no active session token", () => {
    const result = resolveAdminRouteAccess({
      accessToken: "",
      user: null,
    });

    expect(result).toEqual({
      kind: "redirect",
    });
  });
});
