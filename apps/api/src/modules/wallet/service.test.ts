import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { LedgerService } from "../ledger/service.js";
import { WalletService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    ledgerEntry: {
      findMany: vi.fn(),
    },
  },
}));

describe("WalletService", () => {
  const mockedLedgerService = {
    ensureUserAccounts: vi.fn(),
    getAccountBalance: vi.fn(),
  } as unknown as LedgerService;

  const walletService = new WalletService(mockedLedgerService);
  const mockedPrisma = vi.mocked(prisma, true);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns wallet balance grouped by available and reserved accounts", async () => {
    vi.mocked(mockedLedgerService.ensureUserAccounts).mockResolvedValue({
      available: { uuid: "available-uuid" },
      reserved: { uuid: "reserved-uuid" },
    } as never);
    vi.mocked(mockedLedgerService.getAccountBalance)
      .mockResolvedValueOnce({
        accountUuid: "available-uuid",
        currency: "USD",
        available: "125.2500",
      })
      .mockResolvedValueOnce({
        accountUuid: "reserved-uuid",
        currency: "USD",
        available: "24.7500",
      });

    await expect(walletService.getBalance("user-uuid")).resolves.toEqual({
      currency: "USD",
      available: "125.2500",
      reserved: "24.7500",
      total: "150.0000",
      accounts: {
        available: {
          uuid: "available-uuid",
          balance: "125.2500",
        },
        reserved: {
          uuid: "reserved-uuid",
          balance: "24.7500",
        },
      },
    });
  });

  it("returns the wallet statement ordered by newest entries first", async () => {
    vi.mocked(mockedLedgerService.ensureUserAccounts).mockResolvedValue({
      available: { uuid: "available-uuid" },
      reserved: { uuid: "reserved-uuid" },
    } as never);

    mockedPrisma.ledgerEntry.findMany.mockResolvedValue([
      {
        uuid: "entry-1",
        transactionUuid: "tx-1",
        accountUuid: "available-uuid",
        userUuid: "user-uuid",
        entryType: "deposit_completed",
        amount: new Prisma.Decimal("100.0000"),
        direction: "credit",
        referenceType: "payment",
        referenceUuid: null,
        metadata: { provider: "manual" },
        createdAt: new Date("2026-03-27T10:00:00.000Z"),
        account: {
          uuid: "available-uuid",
          accountType: "available",
        },
        transaction: {
          uuid: "tx-1",
          description: "Initial deposit",
        },
      },
    ] as never);

    await expect(
      walletService.getStatement({
        userUuid: "user-uuid",
        limit: 20,
      }),
    ).resolves.toEqual({
      entries: [
        {
          uuid: "entry-1",
          transactionUuid: "tx-1",
          accountUuid: "available-uuid",
          accountType: "available",
          entryType: "deposit_completed",
          amount: "100.0000",
          direction: "credit",
          referenceType: "payment",
          referenceUuid: null,
          description: "Initial deposit",
          createdAt: new Date("2026-03-27T10:00:00.000Z"),
          metadata: { provider: "manual" },
        },
      ],
      meta: {
        count: 1,
        limit: 20,
        currency: "USD",
      },
    });

    expect(mockedPrisma.ledgerEntry.findMany).toHaveBeenCalledWith({
      where: {
        account: {
          userUuid: "user-uuid",
          currency: "USD",
          accountType: {
            in: ["available", "reserved"],
          },
        },
      },
      include: {
        account: {
          select: {
            uuid: true,
            accountType: true,
          },
        },
        transaction: {
          select: {
            uuid: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });
  });
});
