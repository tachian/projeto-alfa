import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";

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

  it("returns a foundation-oriented 404 page for unknown routes", async () => {
    const response = await invokeWebRoute("/nao-existe");

    expect(response.status).toBe(404);
    expect(response.text()).toContain("A rota solicitada ainda nao faz parte do portal.");
    expect(response.text()).toContain('href="/"');
  });
});
