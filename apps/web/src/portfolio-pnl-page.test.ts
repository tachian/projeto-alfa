import { describe, expect, it } from "vitest";

import { renderPortfolioPnlPage } from "./portfolio-pnl-page.js";

describe("renderPortfolioPnlPage", () => {
  it("renders the portfolio pnl workspace", () => {
    const html = renderPortfolioPnlPage({
      appName: "projeto-alfa-web",
      pathname: "/portfolio/pnl",
    });

    expect(html).toContain("PnL consolidado");
    expect(html).toContain('href="/portfolio" aria-current="page"');
    expect(html).toContain("/api/portfolio/pnl");
    expect(html).toContain('id="total-pnl-card"');
  });
});
