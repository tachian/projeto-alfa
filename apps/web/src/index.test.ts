import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

import { handleWebRequest } from "./index.js";

type MockRequest = EventEmitter & {
  method?: string;
  url?: string;
  headers: Record<string, string>;
  [Symbol.asyncIterator]: () => AsyncGenerator<Buffer, void, void>;
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

const createMockResponse = () => ({
  statusCode: 200,
  headers: {} as Record<string, string>,
  body: "",
  writeHead(statusCode: number, headers: Record<string, string>) {
    this.statusCode = statusCode;
    this.headers = headers;
  },
  end(payload = "") {
    this.body = payload;
  },
});

const invokeWebRoute = async (url: string) => {
  const response = createMockResponse();
  const request = createMockRequest({
    method: "GET",
    url,
  });

  await handleWebRequest(request as never, response);

  return {
    status: response.statusCode,
    headers: response.headers,
    text: () => response.body,
  };
};

describe("web portal routes", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("serves the home page", async () => {
    const response = await invokeWebRoute("/");

    expect(response.status).toBe(200);
    expect(response.text()).toContain("Predicao para usuarios comuns");
    expect(response.text()).toContain('href="/register"');
  });

  it("serves the register page with the real onboarding flow", async () => {
    const response = await invokeWebRoute("/register");

    expect(response.status).toBe(200);
    expect(response.text()).toContain("Criar conta");
    expect(response.text()).toContain("nome, email, telefone e senha");
    expect(response.text()).toContain("/api/auth/register");
  });

  it("serves the market catalog page", async () => {
    const response = await invokeWebRoute("/markets");

    expect(response.status).toBe(200);
    expect(response.text()).toContain("Catalogo publico");
    expect(response.text()).toContain('id="markets-grid"');
  });

  it("serves the market detail page", async () => {
    const response = await invokeWebRoute("/markets/11111111-1111-1111-1111-111111111111");

    expect(response.status).toBe(200);
    expect(response.text()).toContain("Resolucao do mercado");
    expect(response.text()).toContain("marketUuid");
  });

  it("serves the authenticated orders page", async () => {
    const response = await invokeWebRoute("/orders");

    expect(response.status).toBe(200);
    expect(response.text()).toContain("Seu trilho operacional no portal.");
    expect(response.text()).toContain('id="orders-filters-form"');
  });

  it("serves the authenticated wallet page", async () => {
    const response = await invokeWebRoute("/wallet");

    expect(response.status).toBe(200);
    expect(response.text()).toContain("Saldo, reserva e extrato em uma tela so.");
    expect(response.text()).toContain('id="wallet-entries"');
  });

  it("serves the payments workspace and starter routes", async () => {
    const workspaceResponse = await invokeWebRoute("/payments");
    expect(workspaceResponse.status).toBe(200);
    expect(workspaceResponse.text()).toContain("Entrada, retirada e historico financeiro em uma trilha propria.");
    expect(workspaceResponse.text()).toContain('href="/payments/deposit"');
    expect(workspaceResponse.text()).toContain('href="/payments/withdraw"');
    expect(workspaceResponse.text()).toContain('href="/payments/history"');

    const depositResponse = await invokeWebRoute("/payments/deposit");
    expect(depositResponse.status).toBe(200);
    expect(depositResponse.text()).toContain("Entrada de recursos pronta para evoluir para PIX.");
    expect(depositResponse.text()).toContain('id="deposit-form"');

    const withdrawResponse = await invokeWebRoute("/payments/withdraw");
    expect(withdrawResponse.status).toBe(200);
    expect(withdrawResponse.text()).toContain("Retirada com contexto de saldo e limites atuais.");
    expect(withdrawResponse.text()).toContain('id="withdraw-form"');

    const historyResponse = await invokeWebRoute("/payments/history");
    expect(historyResponse.status).toBe(200);
    expect(historyResponse.text()).toContain("Historico financeiro separado da carteira e do trading.");
  });

  it("serves the portfolio workspace and subpages", async () => {
    const workspaceResponse = await invokeWebRoute("/portfolio");
    expect(workspaceResponse.status).toBe(200);
    expect(workspaceResponse.text()).toContain('href="/portfolio/positions"');
    expect(workspaceResponse.text()).toContain('href="/portfolio/pnl"');
    expect(workspaceResponse.text()).toContain('href="/portfolio/settlements"');

    const positionsResponse = await invokeWebRoute("/portfolio/positions");
    expect(positionsResponse.status).toBe(200);
    expect(positionsResponse.text()).toContain("Posicoes abertas e historicas");

    const pnlResponse = await invokeWebRoute("/portfolio/pnl");
    expect(pnlResponse.status).toBe(200);
    expect(pnlResponse.text()).toContain('id="total-pnl-card"');

    const settlementsResponse = await invokeWebRoute("/portfolio/settlements");
    expect(settlementsResponse.status).toBe(200);
    expect(settlementsResponse.text()).toContain("Historico de liquidacoes");
  });

  it("serves the account verification page", async () => {
    const response = await invokeWebRoute("/account/verification");

    expect(response.status).toBe(200);
    expect(response.text()).toContain("Conclua sua verificacao para negociar.");
    expect(response.text()).toContain('id="verification-form"');
  });

  it("forwards public market catalog requests to the api", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    );

    globalThis.fetch = fetchMock;

    const response = createMockResponse();
    const request = createMockRequest({
      method: "GET",
      url: "/api/markets?status=open",
    });

    await handleWebRequest(request as never, response);

    expect(response.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/markets?status=open", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("forwards wallet requests to the api", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ balance: { total: "100.00", available: "80.00", reserved: "20.00", currency: "BRL" } }), {
          status: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ entries: [] }), {
          status: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
      );

    globalThis.fetch = fetchMock;

    const balanceResponse = createMockResponse();
    await handleWebRequest(createMockRequest({
      method: "GET",
      url: "/api/wallet/balance",
      headers: {
        authorization: "Bearer user-token",
      },
    }) as never, balanceResponse);

    expect(balanceResponse.statusCode).toBe(200);

    const entriesResponse = createMockResponse();
    await handleWebRequest(createMockRequest({
      method: "GET",
      url: "/api/wallet/entries?limit=100",
      headers: {
        authorization: "Bearer user-token",
      },
    }) as never, entriesResponse);

    expect(entriesResponse.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      new URL("/wallet/balance", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer user-token",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      new URL("/wallet/entries?limit=100", "http://localhost:4000"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer user-token",
        }),
      }),
    );
  });

  it("forwards deposit creation requests to the api", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({
        payment: {
          uuid: "payment-uuid",
          status: "completed",
          amount: "100.0000",
        },
      }), {
        status: 201,
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    );

    globalThis.fetch = fetchMock;

    const response = createMockResponse();
    await handleWebRequest(createMockRequest({
      method: "POST",
      url: "/api/payments/deposits",
      headers: {
        authorization: "Bearer user-token",
        "content-type": "application/json",
        "idempotency-key": "dep-local-001",
      },
      body: JSON.stringify({
        amount: "100.00",
        currency: "USD",
        description: "Top-up local",
      }),
    }) as never, response);

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/payments/deposits", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer user-token",
          "Content-Type": "application/json",
          "Idempotency-Key": "dep-local-001",
        }),
        body: JSON.stringify({
          amount: "100.00",
          currency: "USD",
          description: "Top-up local",
        }),
      }),
    );
  });

  it("forwards withdrawal creation requests to the api", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({
        payment: {
          uuid: "withdrawal-uuid",
          status: "completed",
          amount: "50.0000",
        },
      }), {
        status: 201,
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    );

    globalThis.fetch = fetchMock;

    const response = createMockResponse();
    await handleWebRequest(createMockRequest({
      method: "POST",
      url: "/api/payments/withdrawals",
      headers: {
        authorization: "Bearer user-token",
        "content-type": "application/json",
        "idempotency-key": "wd-local-001",
      },
      body: JSON.stringify({
        amount: "50.00",
        currency: "USD",
        description: "Cash-out local",
      }),
    }) as never, response);

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/payments/withdrawals", "http://localhost:4000"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer user-token",
          "Content-Type": "application/json",
          "Idempotency-Key": "wd-local-001",
        }),
        body: JSON.stringify({
          amount: "50.00",
          currency: "USD",
          description: "Cash-out local",
        }),
      }),
    );
  });

  it("returns a foundation-oriented 404 page for unknown routes", async () => {
    const response = await invokeWebRoute("/nao-existe");

    expect(response.status).toBe(404);
    expect(response.text()).toContain("A rota solicitada ainda nao faz parte do portal.");
    expect(response.text()).toContain('href="/"');
  });
});
