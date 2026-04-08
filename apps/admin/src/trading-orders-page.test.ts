import { describe, expect, it } from "vitest";

import { renderTradingOrdersPage } from "./trading-orders-page.js";

describe("renderTradingOrdersPage", () => {
  it("renders the trading orders workspace", () => {
    const html = renderTradingOrdersPage({
      appName: "projeto-alfa-admin",
      pathname: "/trading/orders",
    });

    expect(html).toContain("Ordens do usuario");
    expect(html).toContain('href="/trading" aria-current="page"');
    expect(html).toContain("/api/orders");
    expect(html).toContain("/api/orders/");
    expect(html).toContain("Cancelar");
  });
});
