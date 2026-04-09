import { describe, expect, it } from "vitest";

import { renderMarketsPage } from "./markets-page.js";

describe("renderMarketsPage", () => {
  it("renders the public market catalog with filters and data hooks", () => {
    const html = renderMarketsPage({
      appName: "projeto-alfa-web",
      pathname: "/markets",
    });

    expect(html).toContain("Catalogo publico");
    expect(html).toContain('id="filters-form"');
    expect(html).toContain('id="markets-grid"');
    expect(html).toContain("/api/markets");
    expect(html).toContain("Abrir detalhe");
  });
});
