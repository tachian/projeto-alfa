import { describe, expect, it } from "vitest";
import { renderAdminDashboardPage } from "./admin-dashboard.js";

describe("renderAdminDashboardPage", () => {
  it("renders the admin dashboard shell with create and action controls", () => {
    const html = renderAdminDashboardPage({
      appName: "projeto-alfa-admin",
    });

    expect(html).toContain("Criar mercado");
    expect(html).toContain("/api/admin/markets");
    expect(html).toContain("/api/auth/me");
    expect(html).toContain("Suspender");
    expect(html).toContain("Fechar");
    expect(html).toContain("window.ProjetoAlfaSession");
    expect(html).toContain("getAccessToken()");
    expect(html).toContain("fetchWithAuth");
    expect(html).toContain("Nao autenticado");
    expect(html).toContain("requireAdminSession");
    expect(html).toContain("Acesso restrito");
    expect(html).toContain("Role:");
    expect(html).toContain('id="logout-button"');
    expect(html).toContain('logout("logged-out")');
    expect(html).not.toContain("Bearer token");
    expect(html).not.toContain('id="auth-token"');
    expect(html).not.toContain('id="save-token"');
  });
});
