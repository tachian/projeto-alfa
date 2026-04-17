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

const parseJson = (value: string): unknown => JSON.parse(value) as unknown;

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

const getFetchInit = (fetchMock: ReturnType<typeof vi.fn<typeof fetch>>, index: number): RequestInit => {
  const call = fetchMock.mock.calls[index];
  const init = call?.[1];

  expect(init).toBeDefined();

  return init as RequestInit;
};

const expectHeadersToMatch = (headers: RequestInit["headers"], expected: Record<string, string>) => {
  expect(headers).toMatchObject(expected);
};

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
    json: () => parseJson(response.body),
  };
};

describe("portal payments journey e2e", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("covers methods, deposit, wallet refresh, withdrawal and financial history reads", async () => {
    const accessHeaders = {
      authorization: "Bearer access-token",
      "content-type": "application/json",
    };

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                key: "manual_mock",
                type: "deposit",
                provider: "manual",
                availability: "enabled",
                executionModel: "instant_completion",
                supportedCurrencies: ["USD"],
              },
              {
                key: "pix",
                type: "deposit",
                provider: "pix_mock",
                availability: "planned",
                executionModel: "async_confirmation",
                supportedCurrencies: ["BRL"],
              },
            ],
            meta: { count: 2, type: "deposit" },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                key: "manual_mock",
                type: "withdrawal",
                provider: "manual",
                availability: "enabled",
                executionModel: "instant_completion",
                supportedCurrencies: ["USD"],
              },
              {
                key: "pix_cashout",
                type: "withdrawal",
                provider: "pix_mock",
                availability: "planned",
                executionModel: "async_confirmation",
                supportedCurrencies: ["BRL"],
              },
            ],
            meta: { count: 2, type: "withdrawal" },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            payment: {
              uuid: "deposit-uuid",
              status: "completed",
              provider: "manual",
              amount: "250.0000",
              currency: "USD",
            },
          }),
          { status: 201, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            balance: {
              available: "250.0000",
              reserved: "0.0000",
              total: "250.0000",
              currency: "USD",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            payment: {
              uuid: "withdrawal-uuid",
              status: "completed",
              provider: "manual",
              amount: "40.0000",
              currency: "USD",
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
                uuid: "deposit-uuid",
                type: "deposit",
                status: "completed",
                provider: "manual",
                amount: "250.0000",
                currency: "USD",
                description: "Top-up local",
                createdAt: "2026-04-12T12:00:00.000Z",
                processedAt: "2026-04-12T12:00:01.000Z",
              },
            ],
            meta: {
              count: 1,
              limit: 20,
              type: "deposit",
              currency: "USD",
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
                uuid: "withdrawal-uuid",
                type: "withdrawal",
                status: "completed",
                provider: "manual",
                amount: "40.0000",
                currency: "USD",
                description: "Cash-out local",
                createdAt: "2026-04-12T12:05:00.000Z",
                processedAt: "2026-04-12T12:05:01.000Z",
              },
            ],
            meta: {
              count: 1,
              limit: 20,
              type: "withdrawal",
              currency: "USD",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            entries: [
              {
                uuid: "entry-1",
                amount: "250.0000",
                currency: "USD",
                entryType: "deposit_completed",
                createdAt: "2026-04-12T12:00:01.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );

    globalThis.fetch = fetchMock;

    const walletPage = await invokeWebRoute({ method: "GET", url: "/wallet" });
    expect(walletPage.status).toBe(200);
    expect(walletPage.text()).toContain("Saldo, reserva e extrato em uma tela so.");

    const depositPage = await invokeWebRoute({ method: "GET", url: "/payments/deposit" });
    expect(depositPage.status).toBe(200);
    expect(depositPage.text()).toContain('id="deposit-form"');

    const withdrawPage = await invokeWebRoute({ method: "GET", url: "/payments/withdraw" });
    expect(withdrawPage.status).toBe(200);
    expect(withdrawPage.text()).toContain('id="withdraw-form"');

    const historyPage = await invokeWebRoute({ method: "GET", url: "/payments/history" });
    expect(historyPage.status).toBe(200);
    expect(historyPage.text()).toContain('id="filters-reset"');

    const depositMethodsResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/payments/methods?type=deposit",
      headers: {
        authorization: "Bearer access-token",
      },
    });
    expect(depositMethodsResponse.status).toBe(200);
    const depositMethodsPayload = depositMethodsResponse.json() as { items: Array<{ key: string }> };
    expect(depositMethodsPayload.items.some((item) => item.key === "manual_mock")).toBe(true);

    const withdrawalMethodsResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/payments/methods?type=withdrawal",
      headers: {
        authorization: "Bearer access-token",
      },
    });
    expect(withdrawalMethodsResponse.status).toBe(200);
    const withdrawalMethodsPayload = withdrawalMethodsResponse.json() as { items: Array<{ key: string }> };
    expect(withdrawalMethodsPayload.items.some((item) => item.key === "manual_mock")).toBe(true);

    const depositResponse = await invokeWebRoute({
      method: "POST",
      url: "/api/payments/deposits",
      headers: {
        ...accessHeaders,
        "idempotency-key": "dep-portal-001",
      },
      body: {
        amount: "250.00",
        currency: "USD",
        method: "manual_mock",
        description: "Top-up local",
      },
    });
    expect(depositResponse.status).toBe(201);

    const walletBalanceResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/wallet/balance",
      headers: {
        authorization: "Bearer access-token",
      },
    });
    expect(walletBalanceResponse.status).toBe(200);
    expect(walletBalanceResponse.json()).toMatchObject({
      balance: {
        total: "250.0000",
      },
    });

    const withdrawalResponse = await invokeWebRoute({
      method: "POST",
      url: "/api/payments/withdrawals",
      headers: {
        ...accessHeaders,
        "idempotency-key": "wd-portal-001",
      },
      body: {
        amount: "40.00",
        currency: "USD",
        method: "manual_mock",
        description: "Cash-out local",
      },
    });
    expect(withdrawalResponse.status).toBe(201);

    const depositsHistoryResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/payments/deposits?currency=USD&limit=20",
      headers: {
        authorization: "Bearer access-token",
      },
    });
    expect(depositsHistoryResponse.status).toBe(200);

    const withdrawalsHistoryResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/payments/withdrawals?currency=USD&limit=20",
      headers: {
        authorization: "Bearer access-token",
      },
    });
    expect(withdrawalsHistoryResponse.status).toBe(200);

    const walletEntriesResponse = await invokeWebRoute({
      method: "GET",
      url: "/api/wallet/entries?limit=100",
      headers: {
        authorization: "Bearer access-token",
      },
    });
    expect(walletEntriesResponse.status).toBe(200);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL("/payments/methods?type=deposit", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
    expectHeadersToMatch(getFetchInit(fetchMock, 0).headers, {
      Authorization: "Bearer access-token",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL("/payments/methods?type=withdrawal", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
    expectHeadersToMatch(getFetchInit(fetchMock, 1).headers, {
      Authorization: "Bearer access-token",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      new URL("/payments/deposits", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          amount: "250.00",
          currency: "USD",
          method: "manual_mock",
          description: "Top-up local",
        }),
      }),
    );
    expectHeadersToMatch(getFetchInit(fetchMock, 2).headers, {
      Authorization: "Bearer access-token",
      "Idempotency-Key": "dep-portal-001",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      new URL("/wallet/balance", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      new URL("/payments/withdrawals", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          amount: "40.00",
          currency: "USD",
          method: "manual_mock",
          description: "Cash-out local",
        }),
      }),
    );
    expectHeadersToMatch(getFetchInit(fetchMock, 4).headers, {
      Authorization: "Bearer access-token",
      "Idempotency-Key": "wd-portal-001",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      new URL("/payments/deposits?currency=USD&limit=20", "http://localhost:4000"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      7,
      new URL("/payments/withdrawals?currency=USD&limit=20", "http://localhost:4000"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      8,
      new URL("/wallet/entries?limit=100", "http://localhost:4000"),
      expect.objectContaining({ method: "GET" }),
    );
  });
});
