import { describe, expect, it } from "vitest";

import { renderWalletPage } from "./wallet-page.js";

describe("renderWalletPage", () => {
  it("renders the wallet workspace with balance and statement sections", () => {
    const html = renderWalletPage({
      appName: "projeto-alfa-web",
      pathname: "/wallet",
    });

    expect(html).toContain("Saldo, reserva e extrato em uma tela so.");
    expect(html).toContain('href="/wallet" aria-current="page"');
    expect(html).toContain('id="wallet-available"');
    expect(html).toContain('id="wallet-reserved"');
    expect(html).toContain('id="wallet-total"');
    expect(html).toContain('id="wallet-entries"');
    expect(html).toContain("/api/wallet/balance");
    expect(html).toContain("/api/wallet/entries?limit=100");
  });
});
