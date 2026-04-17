import { describe, expect, it } from "vitest";

import { DEPOSIT_METHODS, WITHDRAW_METHODS, getAvailablePaymentMethod } from "./payments-methods.js";

describe("payments methods catalog", () => {
  it("keeps an available default method for deposits and withdrawals", () => {
    expect(getAvailablePaymentMethod(DEPOSIT_METHODS)?.key).toBe("manual_mock");
    expect(getAvailablePaymentMethod(WITHDRAW_METHODS)?.key).toBe("manual_mock");
  });

  it("includes planned PIX-oriented methods for future provider integrations", () => {
    expect(DEPOSIT_METHODS.map((method) => method.key)).toContain("pix");
    expect(DEPOSIT_METHODS.map((method) => method.key)).toContain("provider_checkout");
    expect(WITHDRAW_METHODS.map((method) => method.key)).toContain("pix_cashout");
    expect(WITHDRAW_METHODS.map((method) => method.key)).toContain("bank_transfer");
  });
});
