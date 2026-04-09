import { describe, expect, it } from "vitest";

import { renderRegisterPage } from "./register-page.js";

describe("renderRegisterPage", () => {
  it("renders the register form with name, email, phone and password", () => {
    const html = renderRegisterPage({
      appName: "projeto-alfa-web",
    });

    expect(html).toContain("Criar conta");
    expect(html).toContain('id="name"');
    expect(html).toContain('id="email"');
    expect(html).toContain('id="phone"');
    expect(html).toContain('id="password"');
    expect(html).toContain("/api/auth/register");
    expect(html).toContain("returnTo");
  });
});
