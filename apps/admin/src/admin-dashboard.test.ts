import { describe, expect, it } from "vitest";
import { renderAdminDashboardPage } from "./admin-dashboard.js";

describe("renderAdminDashboardPage", () => {
  it("renders the admin dashboard shell with create and action controls", () => {
    const html = renderAdminDashboardPage({
      appName: "projeto-alfa-admin",
    });

    expect(html).toContain("Criar mercado");
    expect(html).toContain("/api/admin/markets");
    expect(html).toContain("Suspender");
    expect(html).toContain("Fechar");
  });
});
