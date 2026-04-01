import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import type { AccountStateServiceContract } from "../account-state/service.js";
import { LedgerService } from "../ledger/service.js";
import { PaymentService } from "./service.js";

const decimalToFixed = (value: Prisma.Decimal | number | string) =>
  (value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value)).toFixed(4);

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    payment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../lib/audit.js", () => ({
  writeAuditLog: vi.fn(),
}));

describe("PaymentService financial consistency", () => {
  const mockedLedgerService = {
    ensureInternalAccounts: vi.fn(),
    getAccountBalance: vi.fn(),
    postTransaction: vi.fn(),
  } as unknown as LedgerService;
  const mockedAccountStateService: AccountStateServiceContract = {
    getUserStatus: vi.fn(),
    assertCanCreateOrder: vi.fn(),
    assertCanCreateDeposit: vi.fn(),
    assertCanCreateWithdrawal: vi.fn(),
  };

  const paymentService = new PaymentService(mockedLedgerService, mockedAccountStateService);
  const mockedPrisma = vi.mocked(prisma, true);

  const transactionClient: {
    payment: {
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    account: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    ledgerTransaction: {
      create: ReturnType<typeof vi.fn>;
    };
    ledgerEntry: {
      create: ReturnType<typeof vi.fn>;
      groupBy: ReturnType<typeof vi.fn>;
    };
  } = {
    payment: {
      create: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    ledgerTransaction: {
      create: vi.fn(),
    },
    ledgerEntry: {
      create: vi.fn(),
      groupBy: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockedAccountStateService.assertCanCreateDeposit).mockResolvedValue();
    vi.mocked(mockedAccountStateService.assertCanCreateWithdrawal).mockResolvedValue();

    vi.mocked(mockedLedgerService.ensureInternalAccounts).mockResolvedValue({
      available: { uuid: "available-uuid" },
      reserved: { uuid: "reserved-uuid" },
      fee: { uuid: "fee-uuid" },
      custody: { uuid: "custody-uuid" },
    } as never);

    mockedPrisma.$transaction.mockImplementation(async (callback) => callback(transactionClient as never));
  });

  it("keeps deposit ledger entries mirrored and balanced", async () => {
    transactionClient.payment.create.mockResolvedValue({
      uuid: "deposit-uuid",
      userUuid: "user-uuid",
      type: "deposit",
      status: "pending",
      provider: "manual",
      idempotencyKey: "dep-100",
      amount: new Prisma.Decimal("100.0000"),
      currency: "USD",
      description: "Deposit",
      metadata: null,
      ledgerTransactionUuid: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: null,
    });
    transactionClient.payment.update.mockResolvedValue({
      uuid: "deposit-uuid",
      userUuid: "user-uuid",
      type: "deposit",
      status: "completed",
      provider: "manual",
      idempotencyKey: "dep-100",
      amount: new Prisma.Decimal("100.0000"),
      currency: "USD",
      description: "Deposit",
      metadata: null,
      ledgerTransactionUuid: "ledger-tx-uuid",
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    });
    vi.mocked(mockedLedgerService.postTransaction).mockResolvedValue({
      transaction: { uuid: "ledger-tx-uuid" },
      entries: [],
    } as never);

    await paymentService.createDeposit({
      userUuid: "user-uuid",
      amount: "100.0000",
      description: "Deposit",
      idempotencyKey: "dep-100",
    });

    const [payload, options] = vi.mocked(mockedLedgerService.postTransaction).mock.calls[0]!;
    const [creditEntry, debitEntry] = payload.entries;

    expect(payload.transactionType).toBe("deposit");
    expect(options).toMatchObject({
      skipAuditLog: true,
    });
    expect(creditEntry.accountUuid).toBe("available-uuid");
    expect(creditEntry.direction).toBe("credit");
    expect(debitEntry.accountUuid).toBe("custody-uuid");
    expect(debitEntry.direction).toBe("debit");
    expect(decimalToFixed(creditEntry.amount)).toBe("100.0000");
    expect(decimalToFixed(debitEntry.amount)).toBe("100.0000");
  });

  it("keeps withdrawal ledger entries mirrored and balanced", async () => {
    vi.mocked(mockedLedgerService.getAccountBalance).mockResolvedValue({
      accountUuid: "available-uuid",
      currency: "USD",
      available: "100.0000",
    });
    transactionClient.payment.create.mockResolvedValue({
      uuid: "withdrawal-uuid",
      userUuid: "user-uuid",
      type: "withdrawal",
      status: "pending",
      provider: "manual",
      idempotencyKey: "wd-100",
      amount: new Prisma.Decimal("40.0000"),
      currency: "USD",
      description: "Withdrawal",
      metadata: null,
      ledgerTransactionUuid: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: null,
    });
    transactionClient.payment.update.mockResolvedValue({
      uuid: "withdrawal-uuid",
      userUuid: "user-uuid",
      type: "withdrawal",
      status: "completed",
      provider: "manual",
      idempotencyKey: "wd-100",
      amount: new Prisma.Decimal("40.0000"),
      currency: "USD",
      description: "Withdrawal",
      metadata: null,
      ledgerTransactionUuid: "ledger-tx-uuid",
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    });
    vi.mocked(mockedLedgerService.postTransaction).mockResolvedValue({
      transaction: { uuid: "ledger-tx-uuid" },
      entries: [],
    } as never);

    await paymentService.createWithdrawal({
      userUuid: "user-uuid",
      amount: "40.0000",
      description: "Withdrawal",
      idempotencyKey: "wd-100",
    });

    const [payload] = vi.mocked(mockedLedgerService.postTransaction).mock.calls[0]!;
    const [debitEntry, creditEntry] = payload.entries;

    expect(payload.transactionType).toBe("withdrawal");
    expect(debitEntry.accountUuid).toBe("available-uuid");
    expect(debitEntry.direction).toBe("debit");
    expect(creditEntry.accountUuid).toBe("custody-uuid");
    expect(creditEntry.direction).toBe("credit");
    expect(decimalToFixed(debitEntry.amount)).toBe("40.0000");
    expect(decimalToFixed(creditEntry.amount)).toBe("40.0000");
  });

  it("does not duplicate financial movement on idempotent retry", async () => {
    mockedPrisma.payment.findFirst.mockResolvedValue({
      uuid: "deposit-uuid",
      userUuid: "user-uuid",
      type: "deposit",
      status: "completed",
      provider: "manual",
      idempotencyKey: "dep-200",
      amount: new Prisma.Decimal("55.0000"),
      currency: "USD",
      description: "Retry-safe deposit",
      metadata: null,
      ledgerTransactionUuid: "ledger-tx-uuid",
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    } as never);

    await paymentService.createDeposit({
      userUuid: "user-uuid",
      amount: "55.0000",
      description: "Retry-safe deposit",
      idempotencyKey: "dep-200",
    });

    expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockedLedgerService.postTransaction).not.toHaveBeenCalled();
  });
});
