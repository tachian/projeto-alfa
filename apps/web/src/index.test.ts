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

  it("returns a foundation-oriented 404 page for unknown routes", async () => {
    const response = await invokeWebRoute("/nao-existe");

    expect(response.status).toBe(404);
    expect(response.text()).toContain("A rota solicitada ainda nao faz parte do portal.");
    expect(response.text()).toContain('href="/"');
  });
});
