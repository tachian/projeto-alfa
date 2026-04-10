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

describe("portal user journey e2e", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("covers register, login, profile update, market exploration, order placement and portfolio consultation", async () => {
    const marketUuid = "44444444-4444-4444-4444-444444444444";
    const accessHeaders = {
      authorization: "Bearer access-token",
      "content-type": "application/json",
    };

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
              name: "Usuario Atualizado",
              email: "novo@example.com",
              phone: "+5585888888888",
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
            market: {
              uuid: marketUuid,
              slug: "mercado-exemplo",
              title: "Vai chover amanhã?",
              description: "Mercado de exemplo",
              category: "tempo",
              status: "open",
              outcomeType: "binary",
              contractValue: "1.00",
              tickSize: 1,
              closeAt: "2026-04-10T12:00:00.000Z",
              rules: {
                officialSourceLabel: "Fonte oficial",
                officialSourceUrl: "https://example.com",
                resolutionRules: "Ganha se chover.",
              },
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            orderBook: {
              levels: [
                {
                  side: "buy",
                  outcome: "YES",
                  price: 55,
                  quantity: 10,
                  orderCount: 2,
                },
              ],
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
                uuid: "trade-uuid",
                price: 55,
                quantity: 2,
                executedAt: "2026-04-09T18:00:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            order: {
              uuid: "order-uuid",
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
                uuid: "position-uuid",
                marketUuid,
                outcome: "YES",
                netQuantity: 2,
                averageEntryPrice: "55.0000",
                markPrice: "58.0000",
                realizedPnl: "0.0000",
                unrealizedPnl: "0.0600",
                totalPnl: "0.0600",
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
              realizedPnl: "0.0000",
              unrealizedPnl: "0.0600",
              totalPnl: "0.0600",
              openPositions: 1,
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
                marketUuid,
                payoutAmount: "1.1000",
                realizedPnlDelta: "0.1000",
                status: "won",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
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

    const loginPageResponse = await invokeWebRoute({
      method: "GET",
      url: "/login?reason=protected&returnTo=%2Fportfolio%2Fpositions",
    });
    expect(loginPageResponse.status).toBe(200);
    expect(loginPageResponse.text()).toContain("Faca login para acessar a area solicitada do portal.");

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

    const profilePageResponse = await invokeWebRoute({
      method: "GET",
      url: "/account/profile",
    });
    expect(profilePageResponse.status).toBe(200);
    expect(profilePageResponse.text()).toContain('id="profile-form"');

    const profileUpdateResponse = await invokeWebRoute({
      method: "PATCH",
      url: "/api/users/me",
      headers: accessHeaders,
      body: {
        name: "Usuario Atualizado",
        email: "novo@example.com",
        phone: "+5585888888888",
      },
    });
    expect(profileUpdateResponse.status).toBe(200);

    const marketPageResponse = await invokeWebRoute({
      method: "GET",
      url: "/markets/" + marketUuid,
    });
    expect(marketPageResponse.status).toBe(200);
    expect(marketPageResponse.text()).toContain('id="trade-form"');

    const marketDetailResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/markets/" + marketUuid,
    });
    expect(marketDetailResponse.status).toBe(200);

    const marketBookResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/markets/" + marketUuid + "/book",
    });
    expect(marketBookResponse.status).toBe(200);

    const marketTradesResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/markets/" + marketUuid + "/trades?limit=20",
    });
    expect(marketTradesResponse.status).toBe(200);

    const createOrderResponse = await invokeWebRoute({
      method: "POST",
      url: "/api/orders",
      headers: accessHeaders,
      body: {
        marketUuid,
        side: "buy",
        outcome: "YES",
        price: 55,
        quantity: 2,
      },
    });
    expect(createOrderResponse.status).toBe(201);

    const positionsPageResponse = await invokeWebRoute({
      method: "GET",
      url: "/portfolio/positions",
    });
    expect(positionsPageResponse.status).toBe(200);
    expect(positionsPageResponse.text()).toContain("Posicoes abertas e historicas");

    const positionsResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/portfolio/positions?limit=100",
      headers: {
        authorization: "Bearer access-token",
      },
    });
    expect(positionsResponse.status).toBe(200);

    const pnlResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/portfolio/pnl",
      headers: {
        authorization: "Bearer access-token",
      },
    });
    expect(pnlResponse.status).toBe(200);

    const settlementsResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/portfolio/settlements?limit=100",
      headers: {
        authorization: "Bearer access-token",
      },
    });
    expect(settlementsResponse.status).toBe(200);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL("/auth/register", "http://localhost:4000"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL("/auth/login", "http://localhost:4000"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      new URL("/users/me", "http://localhost:4000"),
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      new URL("/markets/" + marketUuid, "http://localhost:4000"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      new URL("/markets/" + marketUuid + "/book", "http://localhost:4000"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      new URL("/markets/" + marketUuid + "/trades?limit=20", "http://localhost:4000"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      7,
      new URL("/orders", "http://localhost:4000"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      8,
      new URL("/portfolio/positions?limit=100", "http://localhost:4000"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      9,
      new URL("/portfolio/pnl", "http://localhost:4000"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      10,
      new URL("/portfolio/settlements?limit=100", "http://localhost:4000"),
      expect.objectContaining({ method: "GET" }),
    );
  });
});
