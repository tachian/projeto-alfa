import { describe, expect, it } from "vitest";
import { renderLoginPage } from "./login-page.js";

describe("renderLoginPage", () => {
  it("renders the login form and auth integration hints", () => {
    const html = renderLoginPage({
      appName: "projeto-alfa-admin",
    });

    expect(html).toContain("<form id=\"login-form\">");
    expect(html).toContain("type=\"email\"");
    expect(html).toContain("type=\"password\"");
    expect(html).toContain("/api/auth/login");
    expect(html).toContain("window.ProjetoAlfaSession");
    expect(html).toContain("/auth/refresh");
    expect(html).toContain("reason");
    expect(html).toContain("Sua sessao expirou");
    expect(html).toContain("Email ou senha invalidos");
    expect(html).toContain("A API de autenticacao nao esta disponivel");
  });
});
