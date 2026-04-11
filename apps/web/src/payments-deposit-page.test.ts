import { describe, expect, it } from "vitest";

import { renderPaymentsDepositPage } from "./payments-deposit-page.js";

describe("renderPaymentsDepositPage", () => {
  it("renders the deposit workspace with form and wallet summary", () => {
    const html = renderPaymentsDepositPage({
      appName: "projeto-alfa-web",
      pathname: "/payments/deposit",
    });

    expect(html).toContain("Entrada de recursos pronta para evoluir para PIX.");
    expect(html).toContain('href="/payments"');
    expect(html).toContain('id="deposit-form"');
    expect(html).toContain('id="deposit-method"');
    expect(html).toContain('id="deposit-amount"');
    expect(html).toContain('id="wallet-available"');
    expect(html).toContain("/api/payments/deposits");
    expect(html).toContain("/api/wallet/balance");
  });
});
