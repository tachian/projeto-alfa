import { describe, expect, it } from "vitest";

import { renderPortfolioPositionsPage } from "./portfolio-positions-page.js";

describe("renderPortfolioPositionsPage", () => {
  it("renders the portfolio positions workspace", () => {
    const html = renderPortfolioPositionsPage({
      appName: "projeto-alfa-web",
      pathname: "/portfolio/positions",
    });

    expect(html).toContain("Posicoes abertas e historicas");
    expect(html).toContain('href="/portfolio" aria-current="page"');
    expect(html).toContain("/api/portfolio/positions?limit=100");
  });
});
