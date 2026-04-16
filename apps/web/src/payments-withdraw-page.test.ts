import { describe, expect, it } from "vitest";

import { renderPaymentsWithdrawPage } from "./payments-withdraw-page.js";

describe("renderPaymentsWithdrawPage", () => {
  it("renders the withdraw workspace with form and available balance context", () => {
    const html = renderPaymentsWithdrawPage({
      appName: "projeto-alfa-web",
      pathname: "/payments/withdraw",
    });

    expect(html).toContain("Retirada com contexto de saldo e limites atuais.");
    expect(html).toContain('href="/payments"');
    expect(html).toContain('id="withdraw-form"');
    expect(html).toContain('id="withdraw-amount"');
    expect(html).toContain('id="wallet-available"');
    expect(html).toContain('id="wallet-reserved"');
    expect(html).toContain("/api/payments/withdrawals");
    expect(html).toContain("/api/payments/methods?type=withdrawal");
    expect(html).toContain("/api/wallet/balance");
    expect(html).toContain("PIX cash-out");
    expect(html).toContain("Transferencia bancaria");
    expect(html).toContain("Em breve");
  });

  it("emits a syntactically valid browser script", () => {
    const html = renderPaymentsWithdrawPage({
      appName: "projeto-alfa-web",
      pathname: "/payments/withdraw",
    });

    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1] ?? "");

    expect(scripts).toHaveLength(1);
    expect(() => new Function(scripts[0]!)).not.toThrow();
  });
});
