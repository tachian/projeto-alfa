import { describe, expect, it } from "vitest";
import { renderMarketPage } from "./market-page.js";

describe("renderMarketPage", () => {
  it("renders the market page shell with the target uuid", () => {
    const html = renderMarketPage({
      appName: "projeto-alfa-admin",
      marketUuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
    });

    expect(html).toContain("Mercado 8fbc76f5-3958-4cb5-a7ef-c4bd67b29520");
    expect(html).toContain("/api/markets/");
    expect(html).toContain("Fonte Oficial");
    expect(html).toContain("Como este mercado resolve");
    expect(html).toContain("Order Book");
    expect(html).toContain("Ultimas execucoes");
    expect(html).toContain("Ordens do usuario");
    expect(html).toContain("Historico de resolucao");
    expect(html).toContain("Guiar resolucao e liquidacao");
    expect(html).toContain("Executar ultimo run");
    expect(html).toContain("window.ProjetoAlfaSession");
    expect(html).toContain("/api/auth/me");
    expect(html).toContain("Validando sessao do admin");
    expect(html).toContain("getAccessToken()");
    expect(html).toContain("fetchWithAuth");
    expect(html).toContain("requireAdminSession");
    expect(html).toContain("Acesso restrito");
  });
});
