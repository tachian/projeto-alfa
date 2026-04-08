import { describe, expect, it } from "vitest";

import { renderPortfolioSettlementsPage } from "./portfolio-settlements-page.js";

describe("renderPortfolioSettlementsPage", () => {
  it("renders the portfolio settlements workspace", () => {
    const html = renderPortfolioSettlementsPage({
      appName: "projeto-alfa-admin",
      pathname: "/portfolio/settlements",
    });

    expect(html).toContain("Historico de liquidacoes");
    expect(html).toContain('href="/portfolio" aria-current="page"');
    expect(html).toContain("/api/portfolio/settlements?limit=100");
    expect(html).toContain("Delta PnL");
    expect(html).toContain("window.ProjetoAlfaSession");
  });
});
