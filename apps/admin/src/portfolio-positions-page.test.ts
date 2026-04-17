import { describe, expect, it } from "vitest";

import { renderPortfolioPositionsPage } from "./portfolio-positions-page.js";

describe("renderPortfolioPositionsPage", () => {
  it("renders the portfolio positions workspace", () => {
    const html = renderPortfolioPositionsPage({
      appName: "projeto-alfa-admin",
      pathname: "/portfolio/positions",
    });

    expect(html).toContain("Posicoes em aberto");
    expect(html).toContain('href="/portfolio" aria-current="page"');
    expect(html).toContain("/api/portfolio/positions?limit=100");
    expect(html).toContain("PnL total");
    expect(html).toContain("Posicoes");
    expect(html).toContain("Mercados");
    expect(html).toContain("Long YES");
    expect(html).toContain("Filtro ativo:");
    expect(html).toContain("abrir mercado");
    expect(html).toContain("window.ProjetoAlfaSession");
  });
});
