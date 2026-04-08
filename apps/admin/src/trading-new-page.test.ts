import { describe, expect, it } from "vitest";

import { renderTradingNewPage } from "./trading-new-page.js";

describe("renderTradingNewPage", () => {
  it("renders the trading new order workspace", () => {
    const html = renderTradingNewPage({
      appName: "projeto-alfa-admin",
      pathname: "/trading/new",
    });

    expect(html).toContain("Nova ordem operacional");
    expect(html).toContain('href="/trading" aria-current="page"');
    expect(html).toContain("/api/orders");
    expect(html).toContain("/api/markets?status=open");
    expect(html).toContain("Market UUID");
    expect(html).toContain("Enviar ordem");
  });
});
