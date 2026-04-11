import { describe, expect, it } from "vitest";

import { renderPaymentsHistoryPage } from "./payments-history-page.js";

describe("renderPaymentsHistoryPage", () => {
  it("renders the combined payments history workspace", () => {
    const html = renderPaymentsHistoryPage({
      appName: "projeto-alfa-web",
      pathname: "/payments/history",
    });

    expect(html).toContain("Historico financeiro em uma trilha unica.");
    expect(html).toContain('id="history-filters-form"');
    expect(html).toContain('id="payments-table"');
    expect(html).toContain("/api/payments/deposits");
    expect(html).toContain("/api/payments/withdrawals");
    expect(html).toContain('href="/payments/deposit"');
    expect(html).toContain('href="/payments/withdraw"');
  });
});
