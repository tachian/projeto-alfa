import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

import { handleWebRequest } from "./index.js";

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

const invokeWebRoute = async (input: {
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

  await handleWebRequest(request as never, response as never);

  return {
    status: response.statusCode,
    headers: response.headers,
    text: () => response.body,
    json: () => JSON.parse(response.body),
  };
};

describe("web auth flow e2e", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("forwards register requests to POST /auth/register", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            uuid: "user-uuid",
            name: "Usuario Exemplo",
            email: "user@example.com",
            phone: "+5585999999999",
            role: "user",
            status: "pending_verification",
          },
          tokens: {
            accessToken: "access-token",
            refreshToken: "refresh-token",
            accessTokenExpiresIn: "15m",
            refreshTokenExpiresIn: "7d",
          },
        }),
        { status: 201, headers: { "content-type": "application/json; charset=utf-8" } },
      ),
    );

    globalThis.fetch = fetchMock;

    const registerResponse = await invokeWebRoute({
      method: "POST",
      url: "/api/auth/register",
      headers: {
        "content-type": "application/json",
      },
      body: {
        name: "Usuario Exemplo",
        email: "user@example.com",
        phone: "+5585999999999",
        password: "super-secret-password",
      },
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.json()).toMatchObject({
      user: {
        name: "Usuario Exemplo",
        phone: "+5585999999999",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/auth/register", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("forwards login and me requests to the existing auth endpoints", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              uuid: "user-uuid",
              name: "Usuario Exemplo",
              email: "user@example.com",
              phone: "+5585999999999",
              role: "user",
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
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              uuid: "user-uuid",
              name: "Usuario Exemplo",
              email: "user@example.com",
              phone: "+5585999999999",
              role: "user",
              status: "active",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );

    globalThis.fetch = fetchMock;

    const loginResponse = await invokeWebRoute({
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
      },
    });

    const authMeResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        authorization: "Bearer user-token",
      },
    });

    expect(authMeResponse.status).toBe(200);
    expect(authMeResponse.json()).toMatchObject({
      user: {
        uuid: "user-uuid",
        name: "Usuario Exemplo",
      },
    });
  });

  it("preserves invalid refresh responses from POST /auth/refresh", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Refresh token invalido." }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    );

    globalThis.fetch = fetchMock;

    const refreshResponse = await invokeWebRoute({
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

  it("forwards profile requests to GET and PATCH /users/me", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              uuid: "user-uuid",
              name: "Usuario Exemplo",
              email: "user@example.com",
              phone: "+5585999999999",
              role: "user",
              status: "active",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              uuid: "user-uuid",
              name: "Usuario Atualizado",
              email: "novo@example.com",
              phone: "+5585888888888",
              role: "user",
              status: "active",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );

    globalThis.fetch = fetchMock;

    const profileResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/users/me",
      headers: {
        authorization: "Bearer user-token",
      },
    });

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.json()).toMatchObject({
      user: {
        name: "Usuario Exemplo",
      },
    });

    const updateResponse = await invokeWebRoute({
      method: "PATCH",
      url: "/api/users/me",
      headers: {
        authorization: "Bearer user-token",
        "content-type": "application/json",
      },
      body: {
        name: "Usuario Atualizado",
        email: "novo@example.com",
        phone: "+5585888888888",
      },
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      user: {
        name: "Usuario Atualizado",
        email: "novo@example.com",
      },
    });
  });
});
