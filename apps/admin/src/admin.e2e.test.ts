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
    json: () => JSON.parse(response.body),
  };
};

describe("admin sprint 3 e2e", () => {
  const originalFetch = globalThis.fetch;

  afterEach(async () => {
    globalThis.fetch = originalFetch;
  });

  it("serves the admin dashboard and forwards create/list market requests", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                uuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
                title: "Fed cuts rates in June",
                slug: "fed-cuts-rates",
                category: "macro",
                status: "draft",
                contractValue: "1.00",
                closeAt: "2026-06-18T21:00:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            market: {
              uuid: "new-market-uuid",
            },
          }),
          { status: 201, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );

    globalThis.fetch = fetchMock;

    const pageResponse = await invokeAdminRoute({
      method: "GET",
      url: "/",
    });
    const pageHtml = pageResponse.text();

    expect(pageResponse.status).toBe(200);
    expect(pageHtml).toContain("Criar mercado");
    expect(pageHtml).toContain("Atualizar lista");

    const listResponse = await invokeAdminRoute({
      method: "GET",
      url: "/api/admin/markets",
      headers: {
        authorization: "Bearer admin-token",
      },
    });

    expect(listResponse.status).toBe(200);
    expect(listResponse.json()).toMatchObject({
      items: [
        {
          uuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
        },
      ],
    });

    const createResponse = await invokeAdminRoute({
      method: "POST",
      url: "/api/admin/markets",
      headers: {
        authorization: "Bearer admin-token",
        "content-type": "application/json",
      },
      body: {
        slug: "fed-cuts-rates",
        title: "Fed cuts rates in June",
      },
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.json()).toMatchObject({
      market: {
        uuid: "new-market-uuid",
      },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL("/admin/markets", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer admin-token",
        },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL("/admin/markets", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer admin-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: "fed-cuts-rates",
          title: "Fed cuts rates in June",
        }),
      }),
    );
  });

  it("serves the market page and forwards market detail and status updates", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            market: {
              uuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
              title: "Fed cuts rates in June",
              slug: "fed-cuts-rates",
              category: "macro",
              status: "open",
              outcomeType: "binary",
              contractValue: "1.00",
              tickSize: 1,
              openAt: "2026-06-01T10:00:00.000Z",
              closeAt: "2026-06-18T21:00:00.000Z",
              rules: {
                officialSourceLabel: "Federal Reserve statement",
                officialSourceUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
                resolutionRules: "Resolves YES if the Fed announces a rate cut.",
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
              marketUuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
              marketStatus: "open",
              levels: [],
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
                price: 58,
                quantity: 4,
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                uuid: "order-uuid",
                marketUuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
                side: "buy",
                outcome: "YES",
                status: "open",
                price: 58,
                quantity: 5,
                remainingQuantity: 5,
                createdAt: "2026-06-10T14:00:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            market: {
              uuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
              status: "closed",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );

    globalThis.fetch = fetchMock;

    const pageResponse = await invokeAdminRoute({
      method: "GET",
      url: "/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
    });
    const pageHtml = pageResponse.text();

    expect(pageResponse.status).toBe(200);
    expect(pageHtml).toContain("Editar mercado");
    expect(pageHtml).toContain("Suspender");
    expect(pageHtml).toContain("Fechar");
    expect(pageHtml).toContain("Order Book");
    expect(pageHtml).toContain("Ultimas execucoes");
    expect(pageHtml).toContain("Ordens do usuario");
    expect(pageHtml).toContain("Historico de resolucao");
    expect(pageHtml).toContain("Guiar resolucao e liquidacao");

    const detailResponse = await invokeAdminRoute({
      method: "GET",
      url: "/api/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
    });
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.json()).toMatchObject({
      market: {
        uuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
        status: "open",
      },
    });

    const bookResponse = await invokeAdminRoute({
      method: "GET",
      url: "/api/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/book",
    });
    expect(bookResponse.status).toBe(200);
    expect(bookResponse.json()).toMatchObject({
      orderBook: {
        marketUuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
      },
    });

    const tradesResponse = await invokeAdminRoute({
      method: "GET",
      url: "/api/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/trades?limit=20",
    });
    expect(tradesResponse.status).toBe(200);
    expect(tradesResponse.json()).toMatchObject({
      items: [
        {
          uuid: "trade-uuid",
        },
      ],
    });

    const ordersResponse = await invokeAdminRoute({
      method: "GET",
      url: "/api/orders?marketUuid=8fbc76f5-3958-4cb5-a7ef-c4bd67b29520&limit=20",
      headers: {
        authorization: "Bearer admin-token",
      },
    });
    expect(ordersResponse.status).toBe(200);
    expect(ordersResponse.json()).toMatchObject({
      items: [
        {
          uuid: "order-uuid",
        },
      ],
    });

    const updateResponse = await invokeAdminRoute({
      method: "PATCH",
      url: "/api/admin/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
      headers: {
        authorization: "Bearer admin-token",
        "content-type": "application/json",
      },
      body: {
        status: "closed",
      },
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      market: {
        status: "closed",
      },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL("/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520", "http://localhost:4000"),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL("/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/book", "http://localhost:4000"),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      new URL("/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/trades?limit=20", "http://localhost:4000"),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      new URL("/orders?marketUuid=8fbc76f5-3958-4cb5-a7ef-c4bd67b29520&limit=20", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer admin-token",
        },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      new URL("/admin/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520", "http://localhost:4000"),
      expect.objectContaining({
        method: "PATCH",
        headers: {
          Authorization: "Bearer admin-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "closed",
        }),
      }),
    );
  });

  it("forwards resolution and settlement admin requests from the market page", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                uuid: "resolution-uuid",
                marketUuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
                status: "resolved",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            resolution: {
              uuid: "new-resolution-uuid",
              status: "resolved",
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
                uuid: "run-uuid",
                status: "pending",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            settlementRun: {
              uuid: "new-run-uuid",
              status: "pending",
            },
          }),
          { status: 201, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            settlementRun: {
              uuid: "run-uuid",
              status: "completed",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            settlementRun: {
              uuid: "run-uuid",
              status: "completed",
            },
          }),
          { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );

    globalThis.fetch = fetchMock;

    const listResolutionsResponse = await invokeAdminRoute({
      method: "GET",
      url: "/api/admin/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/resolutions",
      headers: {
        authorization: "Bearer admin-token",
      },
    });
    expect(listResolutionsResponse.status).toBe(200);
    expect(listResolutionsResponse.json()).toMatchObject({
      items: [
        {
          uuid: "resolution-uuid",
        },
      ],
    });

    const createResolutionResponse = await invokeAdminRoute({
      method: "POST",
      url: "/api/admin/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/resolutions",
      headers: {
        authorization: "Bearer admin-token",
        "content-type": "application/json",
      },
      body: {
        status: "resolved",
        winningOutcome: "YES",
      },
    });
    expect(createResolutionResponse.status).toBe(201);
    expect(createResolutionResponse.json()).toMatchObject({
      resolution: {
        uuid: "new-resolution-uuid",
      },
    });

    const listRunsResponse = await invokeAdminRoute({
      method: "GET",
      url: "/api/admin/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/settlement-runs",
      headers: {
        authorization: "Bearer admin-token",
      },
    });
    expect(listRunsResponse.status).toBe(200);
    expect(listRunsResponse.json()).toMatchObject({
      items: [
        {
          uuid: "run-uuid",
        },
      ],
    });

    const createRunResponse = await invokeAdminRoute({
      method: "POST",
      url: "/api/admin/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/settlement-runs",
      headers: {
        authorization: "Bearer admin-token",
        "content-type": "application/json",
      },
      body: {
        marketResolutionUuid: "resolution-uuid",
        status: "pending",
      },
    });
    expect(createRunResponse.status).toBe(201);
    expect(createRunResponse.json()).toMatchObject({
      settlementRun: {
        uuid: "new-run-uuid",
      },
    });

    const updateRunResponse = await invokeAdminRoute({
      method: "PATCH",
      url: "/api/admin/settlement-runs/33333333-3333-4333-8333-333333333333",
      headers: {
        authorization: "Bearer admin-token",
        "content-type": "application/json",
      },
      body: {
        status: "completed",
      },
    });
    expect(updateRunResponse.status).toBe(200);
    expect(updateRunResponse.json()).toMatchObject({
      settlementRun: {
        uuid: "run-uuid",
        status: "completed",
      },
    });

    const executeRunResponse = await invokeAdminRoute({
      method: "POST",
      url: "/api/admin/settlement-runs/33333333-3333-4333-8333-333333333333/execute",
      headers: {
        authorization: "Bearer admin-token",
      },
    });
    expect(executeRunResponse.status).toBe(200);
    expect(executeRunResponse.json()).toMatchObject({
      settlementRun: {
        uuid: "run-uuid",
        status: "completed",
      },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL("/admin/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/resolutions", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer admin-token",
        },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL("/admin/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/resolutions", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      new URL("/admin/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/settlement-runs", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      new URL("/admin/markets/8fbc76f5-3958-4cb5-a7ef-c4bd67b29520/settlement-runs", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      new URL("/admin/settlement-runs/33333333-3333-4333-8333-333333333333", "http://localhost:4000"),
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      new URL("/admin/settlement-runs/33333333-3333-4333-8333-333333333333/execute", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer admin-token",
        },
      }),
    );
  });
});
