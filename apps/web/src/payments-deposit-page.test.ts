import { Script } from "node:vm";
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
    expect(html).toContain('id="deposit-account-note"');
    expect(html).toContain("/api/payments/deposits");
    expect(html).toContain("/api/payments/methods?type=deposit");
    expect(html).toContain("/api/wallet/balance");
    expect(html).toContain("PIX");
    expect(html).toContain("Checkout externo");
    expect(html).toContain("Em breve");
  });

  it("emits a syntactically valid browser script", () => {
    const html = renderPaymentsDepositPage({
      appName: "projeto-alfa-web",
      pathname: "/payments/deposit",
    });

    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1] ?? "");

    expect(scripts).toHaveLength(1);
    expect(() => new Script(scripts[0] ?? "")).not.toThrow();
  });
});
