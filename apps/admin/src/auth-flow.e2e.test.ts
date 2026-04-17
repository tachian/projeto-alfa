import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

import { handleAdminRequest } from "./index.js";

type MockRequest = EventEmitter & {
  method?: string;
  url?: string;
  headers: Record<string, string>;
  [Symbol.asyncIterator]: () => AsyncGenerator<Buffer, void, void>;
};

type MockResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  writeHead: (statusCode: number, headers: Record<string, string>) => void;
  end: (payload?: string) => void;
};

const createMockRequest = (input: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}): MockRequest => {
  const bodyBuffer = input.body ? Buffer.from(input.body) : null;
  const request = new EventEmitter() as MockRequest;

  request.method = input.method;
  request.url = input.url;
  request.headers = input.headers ?? {};
  request[Symbol.asyncIterator] = async function* () {
    if (bodyBuffer) {
      yield bodyBuffer;
    }
  };

  return request;
};

const createMockResponse = (): MockResponse => ({
  statusCode: 200,
  headers: {},
  body: "",
  writeHead(statusCode, headers) {
    this.statusCode = statusCode;
    this.headers = headers;
  },
  end(payload = "") {
    this.body = payload;
  },
});

const invokeAdminRoute = async (input: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}) => {
  const request = createMockRequest({
    method: input.method,
    url: input.url,
    headers: input.headers,
    body: input.body ? JSON.stringify(input.body) : undefined,
  });
  const response = createMockResponse();

  await handleAdminRequest(request as never, response as never);

  return {
    status: response.statusCode,
    headers: response.headers,
    text: () => response.body,
    json: () => parseJson(response.body),
  };
};

describe("admin auth flow e2e", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("uses POST /auth/login to authenticate the admin session", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
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
        }),
        { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
      ),
    );

    globalThis.fetch = fetchMock;

    const loginResponse = await invokeAdminRoute({
      method: "POST",
      url: "/api/auth/login",
      headers: {
        "content-type": "application/json",
      },
      body: {
        email: "user@example.com",
        password: "super-secret-password",
      },
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.json()).toMatchObject({
      user: {
        email: "user@example.com",
        role: "admin",
      },
      tokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/auth/login", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "user@example.com",
          password: "super-secret-password",
        }),
      }),
    );
  });

  it("surfaces invalid credentials from POST /auth/login without turning them into a generic error", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Credenciais invalidas." }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    );

    globalThis.fetch = fetchMock;

    const loginResponse = await invokeAdminRoute({
      method: "POST",
      url: "/api/auth/login",
      headers: {
        "content-type": "application/json",
      },
      body: {
        email: "user@example.com",
        password: "senha-invalida",
      },
    });

    expect(loginResponse.status).toBe(401);
    expect(loginResponse.json()).toEqual({
      message: "Credenciais invalidas.",
    });
  });

  it("uses GET /auth/me to bootstrap the authenticated admin identity", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            uuid: "admin-user-uuid",
            email: "user@example.com",
            role: "admin",
            status: "active",
          },
        }),
        { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
      ),
    );

    globalThis.fetch = fetchMock;

    const authMeResponse = await invokeAdminRoute({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        authorization: "Bearer admin-token",
      },
    });

    expect(authMeResponse.status).toBe(200);
    expect(authMeResponse.json()).toEqual({
      user: {
        uuid: "admin-user-uuid",
        email: "user@example.com",
        role: "admin",
        status: "active",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/auth/me", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer admin-token",
        },
      }),
    );
  });

  it("preserves invalid refresh responses from POST /auth/refresh", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Refresh token invalido." }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    );

    globalThis.fetch = fetchMock;

    const refreshResponse = await invokeAdminRoute({
      method: "POST",
      url: "/api/auth/refresh",
      headers: {
        "content-type": "application/json",
      },
      body: {
        refreshToken: "invalid-refresh-token",
      },
    });

    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.json()).toEqual({
      message: "Refresh token invalido.",
    });
  });
});
const parseJson = (value: string): unknown => JSON.parse(value) as unknown;
