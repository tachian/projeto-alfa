import { describe, expect, it } from "vitest";

import { renderMarketDetailPage } from "./market-detail-page.js";

describe("renderMarketDetailPage", () => {
  it("renders the market detail page with rules, book and trades sections", () => {
    const html = renderMarketDetailPage({
      appName: "projeto-alfa-web",
      pathname: "/markets/11111111-1111-1111-1111-111111111111",
      marketUuid: "11111111-1111-1111-1111-111111111111",
    });

    expect(html).toContain("Resolucao do mercado");
    expect(html).toContain('id="order-book"');
    expect(html).toContain('id="market-trades"');
    expect(html).toContain('id="trade-form"');
    expect(html).toContain("/api/orders");
    expect(html).toContain('/api/markets/" + marketUuid + "/book');
    expect(html).toContain("Enviar ordem neste mercado");
  });
});
