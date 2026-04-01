import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { AccountStateError, AccountStateService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("AccountStateService", () => {
  const service = new AccountStateService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the normalized user status", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      status: "active",
    } as never);

    await expect(service.getUserStatus("user-uuid")).resolves.toBe("active");
  });

  it("blocks order creation for pending verification accounts", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      status: "pending_verification",
    } as never);

    await expect(service.assertCanCreateOrder("user-uuid")).rejects.toThrowError(
      new AccountStateError(
        "A conta precisa estar ativa para negociar. Conclua a verificacao ou contate o suporte.",
        403,
      ),
    );
  });

  it("allows deposits while the account is pending verification", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      status: "pending_verification",
    } as never);

    await expect(service.assertCanCreateDeposit("user-uuid")).resolves.toBeUndefined();
  });

  it("blocks deposits for restricted accounts", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      status: "restricted",
    } as never);

    await expect(service.assertCanCreateDeposit("user-uuid")).rejects.toThrowError(
      new AccountStateError(
        "A conta esta bloqueada para movimentacoes financeiras. Contate o suporte.",
        403,
      ),
    );
  });
});
