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
  });
});
