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

  it("forwards kyc verification routes to the existing kyc endpoints", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            verification: {
              uuid: "verification-uuid",
              status: "approved",
              amlStatus: "clear",
              riskLevel: "low",
            },
          }),
          { status: 201, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            verification: {
              uuid: "verification-uuid",
              status: "approved",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "approved",
            requirements: [],
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );

    globalThis.fetch = fetchMock;

    const createResponse = await invokeWebRoute({
      method: "POST",
      url: "/api/kyc/submissions",
      headers: {
        authorization: "Bearer user-token",
        "content-type": "application/json",
      },
      body: {
        fullName: "Usuario Exemplo",
        documentType: "cpf",
        documentNumber: "12345678901",
        countryCode: "BR",
        birthDate: "1990-01-01",
      },
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.json()).toMatchObject({
      verification: {
        uuid: "verification-uuid",
      },
    });

    const latestResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/kyc/submissions/latest",
      headers: {
        authorization: "Bearer user-token",
      },
    });

    expect(latestResponse.status).toBe(200);
    expect(latestResponse.json()).toMatchObject({
      verification: {
        status: "approved",
      },
    });

    const requirementsResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/kyc/requirements",
      headers: {
        authorization: "Bearer user-token",
      },
    });

    expect(requirementsResponse.status).toBe(200);
    expect(requirementsResponse.json()).toMatchObject({
      status: "approved",
      requirements: [],
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL("/kyc/submissions", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL("/kyc/submissions/latest", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      new URL("/kyc/requirements", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("forwards order creation, listing and cancellation to the existing trading endpoints", async () => {
    const orderUuid = "11111111-1111-1111-1111-111111111111";
    const marketUuid = "22222222-2222-2222-2222-222222222222";
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            order: {
              uuid: orderUuid,
              marketUuid,
              side: "buy",
              outcome: "YES",
              status: "open",
            },
          }),
          { status: 201, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                uuid: orderUuid,
                marketUuid,
                side: "buy",
                outcome: "YES",
                status: "open",
                price: 55,
                quantity: 3,
                remainingQuantity: 3,
                createdAt: "2026-04-09T10:00:00.000Z",
                market: {
                  uuid: marketUuid,
                  title: "Vai chover?",
                },
              },
            ],
            meta: {
              count: 1,
              limit: 20,
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            order: {
              uuid: orderUuid,
              status: "cancelled",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );

    globalThis.fetch = fetchMock;

    const createResponse = await invokeWebRoute({
      method: "POST",
      url: "/api/orders",
      headers: {
        authorization: "Bearer user-token",
        "content-type": "application/json",
      },
      body: {
        marketUuid,
        side: "buy",
        outcome: "YES",
        price: 55,
        quantity: 3,
      },
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.json()).toMatchObject({
      order: {
        uuid: orderUuid,
      },
    });

    const listResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/orders?status=open&limit=20",
      headers: {
        authorization: "Bearer user-token",
      },
    });

    expect(listResponse.status).toBe(200);
    expect(listResponse.json()).toMatchObject({
      items: [
        {
          uuid: orderUuid,
        },
      ],
    });

    const cancelResponse = await invokeWebRoute({
      method: "POST",
      url: "/api/orders/" + orderUuid + "/cancel",
      headers: {
        authorization: "Bearer user-token",
      },
    });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.json()).toMatchObject({
      order: {
        status: "cancelled",
      },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL("/orders", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL("/orders?status=open&limit=20", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      new URL("/orders/" + orderUuid + "/cancel", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("forwards portfolio positions, pnl and settlements to the existing portfolio endpoints", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                uuid: "position-uuid",
                marketUuid: "33333333-3333-3333-3333-333333333333",
                outcome: "YES",
                netQuantity: 4,
                averageEntryPrice: "55.0000",
                markPrice: "58.0000",
                realizedPnl: "0.0000",
                unrealizedPnl: "0.1200",
                totalPnl: "0.1200",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            summary: {
              realizedPnl: "1.2500",
              unrealizedPnl: "0.5000",
              totalPnl: "1.7500",
              openPositions: 2,
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                uuid: "settlement-uuid",
                marketUuid: "33333333-3333-3333-3333-333333333333",
                payoutAmount: "2.0000",
                status: "won",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );

    globalThis.fetch = fetchMock;

    const positionsResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/portfolio/positions?limit=100",
      headers: {
        authorization: "Bearer user-token",
      },
    });

    expect(positionsResponse.status).toBe(200);
    expect(positionsResponse.json()).toMatchObject({
      items: [
        {
          uuid: "position-uuid",
        },
      ],
    });

    const pnlResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/portfolio/pnl",
      headers: {
        authorization: "Bearer user-token",
      },
    });

    expect(pnlResponse.status).toBe(200);
    expect(pnlResponse.json()).toMatchObject({
      summary: {
        totalPnl: "1.7500",
      },
    });

    const settlementsResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/portfolio/settlements?limit=100",
      headers: {
        authorization: "Bearer user-token",
      },
    });

    expect(settlementsResponse.status).toBe(200);
    expect(settlementsResponse.json()).toMatchObject({
      items: [
        {
          uuid: "settlement-uuid",
        },
      ],
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL("/portfolio/positions?limit=100", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL("/portfolio/pnl", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      new URL("/portfolio/settlements?limit=100", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("forwards wallet balance and statement requests to the existing wallet endpoints", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            balance: {
              currency: "BRL",
              available: "80.00",
              reserved: "20.00",
              total: "100.00",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            entries: [],
            meta: {
              count: 0,
              limit: 100,
              currency: "BRL",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );

    globalThis.fetch = fetchMock;

    const balanceResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/wallet/balance",
      headers: {
        authorization: "Bearer user-token",
      },
    });

    expect(balanceResponse.status).toBe(200);
    expect(balanceResponse.json()).toMatchObject({
      balance: {
        total: "100.00",
      },
    });

    const entriesResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/wallet/entries?limit=100",
      headers: {
        authorization: "Bearer user-token",
      },
    });

    expect(entriesResponse.status).toBe(200);
    expect(entriesResponse.json()).toMatchObject({
      meta: {
        limit: 100,
      },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL("/wallet/balance", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL("/wallet/entries?limit=100", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("forwards deposit creation to the existing payments endpoint", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          payment: {
            uuid: "payment-uuid",
            status: "completed",
            amount: "150.0000",
            currency: "USD",
          },
        }),
        { status: 201, headers: { "content-type": "application/json; charset=utf-8" } },
      ),
    );

    globalThis.fetch = fetchMock;

    const depositResponse = await invokeWebRoute({
      method: "POST",
      url: "/api/payments/deposits",
      headers: {
        authorization: "Bearer user-token",
        "content-type": "application/json",
      },
      body: {
        amount: "150.00",
        currency: "USD",
        description: "Top-up local",
      },
    });

    expect(depositResponse.status).toBe(201);
    expect(depositResponse.json()).toMatchObject({
      payment: {
        uuid: "payment-uuid",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/payments/deposits", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer user-token",
        }),
      }),
    );
  });
});
