import { describe, expect, it } from "vitest";

import { renderOrdersPage } from "./orders-page.js";

describe("renderOrdersPage", () => {
  it("renders the authenticated orders workspace with filters and cancellation flow hooks", () => {
    const html = renderOrdersPage({
      appName: "projeto-alfa-web",
      pathname: "/orders",
    });

    expect(html).toContain("Seu trilho operacional no portal.");
    expect(html).toContain('id="orders-filters-form"');
    expect(html).toContain('id="orders-table"');
    expect(html).toContain("/api/orders");
    expect(html).toContain("Cancelar");
    expect(html).toContain("Filtro de mercado invalido. Informe um UUID valido.");
  });
});
