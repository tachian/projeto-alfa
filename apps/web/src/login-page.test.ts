import { describe, expect, it } from "vitest";

import { renderLoginPage } from "./login-page.js";

describe("renderLoginPage", () => {
  it("renders the login form wired to the existing auth endpoints", () => {
    const html = renderLoginPage({
      appName: "projeto-alfa-web",
    });

    expect(html).toContain("Entrar no portal");
    expect(html).toContain('id="auth-form"');
    expect(html).toContain("/api/auth/login");
    expect(html).toContain("window.ProjetoAlfaWebSession");
    expect(html).toContain("Email ou senha invalidos");
  });
});
