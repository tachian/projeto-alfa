import { describe, expect, it } from "vitest";

import { renderPortfolioPnlPage } from "./portfolio-pnl-page.js";

describe("renderPortfolioPnlPage", () => {
  it("renders the portfolio pnl workspace", () => {
    const html = renderPortfolioPnlPage({
      appName: "projeto-alfa-admin",
      pathname: "/portfolio/pnl",
    });

    expect(html).toContain("PnL consolidado");
    expect(html).toContain('href="/portfolio" aria-current="page"');
    expect(html).toContain("/api/portfolio/pnl");
    expect(html).toContain("Posicoes abertas");
    expect(html).toContain("Resumo de PnL carregado com sucesso.");
  });
});
