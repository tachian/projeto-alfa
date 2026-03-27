import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { writeAuditLog } from "../../lib/audit.js";
import { prisma } from "../../lib/prisma.js";
import { INTERNAL_ACCOUNT_TYPES, LedgerError, LedgerService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    account: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    ledgerEntry: {
      groupBy: vi.fn(),
    },
    ledgerTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../lib/audit.js", () => ({
  writeAuditLog: vi.fn(),
}));

const mockedPrisma = vi.mocked(prisma, true);
const mockedWriteAuditLog = vi.mocked(writeAuditLog);

describe("LedgerService", () => {
  const ledgerService = new LedgerService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the default internal accounts", async () => {
    mockedPrisma.account.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockedPrisma.account.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockedPrisma.account.create
      .mockResolvedValueOnce({
        uuid: "available-uuid",
        userUuid: "user-uuid",
        currency: "USD",
        accountType: INTERNAL_ACCOUNT_TYPES.available,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        uuid: "reserved-uuid",
        userUuid: "user-uuid",
        currency: "USD",
        accountType: INTERNAL_ACCOUNT_TYPES.reserved,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        uuid: "fee-uuid",
        userUuid: null,
        currency: "USD",
        accountType: INTERNAL_ACCOUNT_TYPES.fee,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        uuid: "custody-uuid",
        userUuid: null,
        currency: "USD",
        accountType: INTERNAL_ACCOUNT_TYPES.custody,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    await expect(
      ledgerService.ensureInternalAccounts({
        userUuid: "user-uuid",
      }),
    ).resolves.toMatchObject({
      available: {
        uuid: "available-uuid",
      },
      reserved: {
        uuid: "reserved-uuid",
      },
      fee: {
        uuid: "fee-uuid",
      },
      custody: {
        uuid: "custody-uuid",
      },
    });

    expect(mockedPrisma.account.create).toHaveBeenCalledTimes(4);
  });

  it("rejects an unbalanced transaction", async () => {
    mockedPrisma.account.findMany.mockResolvedValue([
      {
        uuid: "account-a",
        userUuid: "user-a",
        currency: "USD",
        accountType: "user_available",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uuid: "account-b",
        userUuid: null,
        currency: "USD",
        accountType: "platform_cash",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await expect(
      ledgerService.postTransaction({
        transactionType: "deposit",
        referenceType: "payment",
        entries: [
          {
            accountUuid: "account-a",
            entryType: "deposit_pending",
            amount: 100,
            direction: "credit",
            referenceType: "payment",
          },
          {
            accountUuid: "account-b",
            entryType: "deposit_pending",
            amount: 90,
            direction: "debit",
            referenceType: "payment",
          },
        ],
      }),
    ).rejects.toThrow(LedgerError);
  });

  it("posts a balanced double-entry transaction", async () => {
    mockedPrisma.account.findMany.mockResolvedValue([
      {
        uuid: "account-a",
        userUuid: "user-a",
        currency: "USD",
        accountType: "user_available",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uuid: "account-b",
        userUuid: null,
        currency: "USD",
        accountType: "platform_cash",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    mockedPrisma.$transaction.mockImplementation(async (callback) =>
      callback({
        ledgerTransaction: {
          create: vi.fn().mockResolvedValue({
            uuid: "transaction-uuid",
            transactionType: "deposit",
            referenceType: "payment",
            referenceUuid: null,
          }),
        },
        ledgerEntry: {
          create: vi
            .fn()
            .mockResolvedValueOnce({ uuid: "entry-1" })
            .mockResolvedValueOnce({ uuid: "entry-2" }),
        },
      } as never),
    );

    const result = await ledgerService.postTransaction({
      transactionType: "deposit",
      referenceType: "payment",
      description: "User deposit",
      entries: [
        {
          accountUuid: "account-a",
          entryType: "deposit_completed",
          amount: 100,
          direction: "credit",
          referenceType: "payment",
        },
        {
          accountUuid: "account-b",
          entryType: "deposit_completed",
          amount: 100,
          direction: "debit",
          referenceType: "payment",
        },
      ],
    });

    expect(result.transaction.uuid).toBe("transaction-uuid");
    expect(result.entries).toHaveLength(2);
    expect(mockedWriteAuditLog).toHaveBeenCalledWith({
      action: "ledger.transaction.posted",
      targetType: "ledger_transaction",
      targetUuid: "transaction-uuid",
      payload: {
        transactionType: "deposit",
        entryCount: 2,
        referenceType: "payment",
        referenceUuid: null,
      },
    });
  });

  it("computes the account balance from credits minus debits", async () => {
    mockedPrisma.account.findUnique.mockResolvedValue({
      uuid: "account-a",
      userUuid: "user-a",
      currency: "USD",
      accountType: "user_available",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockedPrisma.ledgerEntry.groupBy.mockResolvedValue([
      {
        direction: "credit",
        _sum: {
          amount: new Prisma.Decimal(150),
        },
      },
      {
        direction: "debit",
        _sum: {
          amount: new Prisma.Decimal(40),
        },
      },
    ] as never);

    await expect(ledgerService.getAccountBalance("account-a")).resolves.toEqual({
      accountUuid: "account-a",
      currency: "USD",
      available: "110.0000",
    });
  });
});
