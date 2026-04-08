import { describe, expect, it, vi } from "vitest";

import { ADMIN_SESSION_STORAGE_KEY, ADMIN_TOKEN_STORAGE_KEY, createAdminSessionClient } from "./session.js";

const createMemoryStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
};

describe("createAdminSessionClient refresh flow", () => {
  it("persists the rotated session after a successful refresh", async () => {
    const storage = createMemoryStorage();
    const redirect = vi.fn();
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          user: {
            uuid: "admin-user-uuid",
            email: "user@example.com",
            role: "admin",
            status: "active",
          },
          tokens: {
            accessToken: "rotated-access-token",
            refreshToken: "rotated-refresh-token",
            accessTokenExpiresIn: "15m",
            refreshTokenExpiresIn: "7d",
          },
        }),
    });

    const client = createAdminSessionClient({
      storage,
      fetch: fetchMock,
      origin: "http://localhost:3000",
      redirect,
    });

    client.save({
      user: {
        uuid: "admin-user-uuid",
        email: "user@example.com",
        role: "admin",
        status: "active",
      },
      tokens: {
        accessToken: "stale-access-token",
        refreshToken: "refresh-token",
        accessTokenExpiresIn: "15m",
        refreshTokenExpiresIn: "7d",
      },
    });

    const refreshedSession = await client.refresh();

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: "refresh-token",
      }),
    });
    expect(refreshedSession.tokens.accessToken).toBe("rotated-access-token");
    expect(client.getAccessToken()).toBe("rotated-access-token");
    expect(JSON.parse(storage.getItem(ADMIN_SESSION_STORAGE_KEY) ?? "{}")).toMatchObject({
      tokens: {
        accessToken: "rotated-access-token",
        refreshToken: "rotated-refresh-token",
      },
    });
  });

  it("clears the local session when refresh is invalid", async () => {
    const storage = createMemoryStorage();
    const redirect = vi.fn();
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: "Refresh token invalido." }),
    });

    const client = createAdminSessionClient({
      storage,
      fetch: fetchMock,
      origin: "http://localhost:3000",
      redirect,
    });

    client.save({
      user: {
        uuid: "admin-user-uuid",
        email: "user@example.com",
        role: "admin",
        status: "active",
      },
      tokens: {
        accessToken: "stale-access-token",
        refreshToken: "invalid-refresh-token",
        accessTokenExpiresIn: "15m",
        refreshTokenExpiresIn: "7d",
      },
    });

    await expect(client.refresh()).rejects.toMatchObject({
      code: "unauthenticated",
      message: "Refresh token invalido.",
    });
    expect(storage.getItem(ADMIN_SESSION_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(ADMIN_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("retries the original request after refreshing the access token", async () => {
    const storage = createMemoryStorage();
    const redirect = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: "Token expirado." }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            user: {
              uuid: "admin-user-uuid",
              email: "user@example.com",
              role: "admin",
              status: "active",
            },
            tokens: {
              accessToken: "fresh-access-token",
              refreshToken: "fresh-refresh-token",
              accessTokenExpiresIn: "15m",
              refreshTokenExpiresIn: "7d",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      });

    const client = createAdminSessionClient({
      storage,
      fetch: fetchMock,
      origin: "http://localhost:3000",
      redirect,
    });

    client.save({
      user: {
        uuid: "admin-user-uuid",
        email: "user@example.com",
        role: "admin",
        status: "active",
      },
      tokens: {
        accessToken: "expired-access-token",
        refreshToken: "refresh-token",
        accessTokenExpiresIn: "15m",
        refreshTokenExpiresIn: "7d",
      },
    });

    const response = await client.fetchWithAuth("/api/admin/markets", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/admin/markets", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer expired-access-token",
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: "refresh-token",
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/admin/markets", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer fresh-access-token",
      },
    });
  });

  it("resolves the authenticated admin user from the existing auth endpoint", async () => {
    const storage = createMemoryStorage();
    const redirect = vi.fn();
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          user: {
            uuid: "admin-user-uuid",
            email: "user@example.com",
            role: "admin",
            status: "active",
          },
        }),
    });

    const client = createAdminSessionClient({
      storage,
      fetch: fetchMock,
      origin: "http://localhost:3000",
      redirect,
    });

    client.save({
      user: {
        uuid: "admin-user-uuid",
        email: "user@example.com",
        role: "admin",
        status: "active",
      },
      tokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        accessTokenExpiresIn: "15m",
        refreshTokenExpiresIn: "7d",
      },
    });

    const user = await client.resolveAdminUser();

    expect(user).toMatchObject({
      email: "user@example.com",
      role: "admin",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer access-token",
      },
    });
  });

  it("converts 403 responses into a forbidden session error", async () => {
    const storage = createMemoryStorage();
    const redirect = vi.fn();
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ message: "Acesso restrito a administradores." }),
    });

    const client = createAdminSessionClient({
      storage,
      fetch: fetchMock,
      origin: "http://localhost:3000",
      redirect,
    });

    client.save({
      user: {
        uuid: "non-admin-user-uuid",
        email: "user@example.com",
        role: "user",
        status: "active",
      },
      tokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        accessTokenExpiresIn: "15m",
        refreshTokenExpiresIn: "7d",
      },
    });

    await expect(
      client.fetchJsonWithAuth("/api/admin/markets", { method: "GET" }),
    ).rejects.toMatchObject({
      code: "forbidden",
      message: "Acesso restrito a administradores.",
    });
  });
});
