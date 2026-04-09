import { describe, expect, it } from "vitest";

import { handleWebRequest } from "./index.js";

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

  await handleWebRequest(url, response);

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

  it("serves the register foundation page", async () => {
    const response = await invokeWebRoute("/register");

    expect(response.status).toBe(200);
    expect(response.text()).toContain("Onboarding enxuto");
    expect(response.text()).toContain("nome, email, telefone e senha");
  });

  it("returns a foundation-oriented 404 page for unknown routes", async () => {
    const response = await invokeWebRoute("/nao-existe");

    expect(response.status).toBe(404);
    expect(response.text()).toContain("A rota solicitada ainda nao faz parte do portal.");
    expect(response.text()).toContain('href="/"');
  });
});
