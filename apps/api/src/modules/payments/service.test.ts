import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { writeAuditLog } from "../../lib/audit.js";
import { prisma } from "../../lib/prisma.js";
import type { AccountStateServiceContract } from "../account-state/service.js";
import { AccountStateError } from "../account-state/service.js";
import type { LedgerService } from "../ledger/service.js";
import type { RiskServiceContract } from "../risk/service.js";
import { RiskError } from "../risk/service.js";
import { PaymentError } from "./errors.js";
import { PaymentService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    payment: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../lib/audit.js", () => ({
  writeAuditLog: vi.fn(),
}));

describe("PaymentService", () => {
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
  const mockedRiskService: RiskServiceContract = {
    assertOrderWithinLimits: vi.fn(),
    assertWithdrawalWithinLimits: vi.fn(),
  };

  const paymentService = new PaymentService(mockedLedgerService, mockedAccountStateService, mockedRiskService);
  const mockedPrisma = vi.mocked(prisma, true);
  const mockedWriteAuditLog = vi.mocked(writeAuditLog);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockedAccountStateService.assertCanCreateDeposit).mockResolvedValue();
    vi.mocked(mockedAccountStateService.assertCanCreateWithdrawal).mockResolvedValue();
    vi.mocked(mockedRiskService.assertWithdrawalWithinLimits).mockResolvedValue();
  });

  it("creates a completed mock deposit and posts it inside a transaction", async () => {
    vi.mocked(mockedLedgerService.ensureInternalAccounts).mockResolvedValue({
      available: { uuid: "available-uuid" },
      reserved: { uuid: "reserved-uuid" },
      fee: { uuid: "fee-uuid" },
      custody: { uuid: "custody-uuid" },
    } as never);
    vi.mocked(mockedLedgerService.postTransaction).mockResolvedValue({
      transaction: {
        uuid: "ledger-tx-uuid",
      },
      entries: [],
    } as never);
    mockedPrisma.$transaction.mockImplementation(async (callback) =>
      callback({
        payment: {
          create: vi.fn().mockResolvedValue({
            uuid: "payment-uuid",
            userUuid: "user-uuid",
            type: "deposit",
            status: "pending",
            provider: "manual",
            idempotencyKey: "dep-001",
            amount: new Prisma.Decimal("100.0000"),
            currency: "USD",
            description: "Manual top-up",
            metadata: null,
            ledgerTransactionUuid: null,
            createdAt: new Date("2026-03-27T12:00:00.000Z"),
            updatedAt: new Date("2026-03-27T12:00:00.000Z"),
            processedAt: null,
          }),
          update: vi.fn().mockResolvedValue({
            uuid: "payment-uuid",
            userUuid: "user-uuid",
            type: "deposit",
            status: "completed",
            provider: "manual",
            idempotencyKey: "dep-001",
            amount: new Prisma.Decimal("100.0000"),
            currency: "USD",
            description: "Manual top-up",
            metadata: null,
            ledgerTransactionUuid: "ledger-tx-uuid",
            createdAt: new Date("2026-03-27T12:00:00.000Z"),
            updatedAt: new Date("2026-03-27T12:01:00.000Z"),
            processedAt: new Date("2026-03-27T12:01:00.000Z"),
          }),
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
      } as never),
    );

    await expect(
      paymentService.createDeposit({
        userUuid: "user-uuid",
        amount: 100,
        description: "Manual top-up",
        idempotencyKey: "dep-001",
      }),
    ).resolves.toMatchObject({
      uuid: "payment-uuid",
      status: "completed",
      amount: "100.0000",
      idempotencyKey: "dep-001",
      ledgerTransactionUuid: "ledger-tx-uuid",
    });

    expect(mockedLedgerService.postTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionType: "deposit",
        referenceType: "payment",
        referenceUuid: "payment-uuid",
      }),
      expect.objectContaining({
        skipAuditLog: true,
      }),
    );
    expect(mockedWriteAuditLog).toHaveBeenCalledWith({
      action: "payments.deposit.completed",
      targetType: "payment",
      targetUuid: "payment-uuid",
      payload: {
        amount: "100.0000",
        currency: "USD",
        userUuid: "user-uuid",
        idempotencyKey: "dep-001",
        provider: "manual",
        paymentMethod: "manual_mock",
        status: "completed",
      },
    });
  });

  it("lists payment methods with enabled and planned capabilities", async () => {
    await expect(paymentService.listMethods({ type: "deposit" })).resolves.toEqual({
      items: expect.arrayContaining([
        expect.objectContaining({
          key: "manual_mock",
          type: "deposit",
          availability: "enabled",
          executionModel: "instant_completion",
        }),
        expect.objectContaining({
          key: "pix",
          type: "deposit",
          availability: "planned",
          executionModel: "async_confirmation",
        }),
      ]),
      meta: {
        count: 3,
        type: "deposit",
      },
    });
  });

  it("blocks withdrawals that exceed the available balance", async () => {
    vi.mocked(mockedLedgerService.ensureInternalAccounts).mockResolvedValue({
      available: { uuid: "available-uuid" },
      reserved: { uuid: "reserved-uuid" },
      fee: { uuid: "fee-uuid" },
      custody: { uuid: "custody-uuid" },
    } as never);
    vi.mocked(mockedLedgerService.getAccountBalance).mockResolvedValue({
      accountUuid: "available-uuid",
      currency: "USD",
      available: "30.0000",
    });
    mockedPrisma.$transaction.mockImplementation(async (callback) =>
      callback({
        payment: {
          aggregate: vi.fn(),
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
      } as never),
    );

    await expect(
      paymentService.createWithdrawal({
        userUuid: "user-uuid",
        amount: 40,
      }),
    ).rejects.toThrowError(new PaymentError("Saldo insuficiente para saque.", 400));
  });

  it("blocks withdrawals that exceed the configured risk limits", async () => {
    vi.mocked(mockedLedgerService.ensureInternalAccounts).mockResolvedValue({
      available: { uuid: "available-uuid" },
      reserved: { uuid: "reserved-uuid" },
      fee: { uuid: "fee-uuid" },
      custody: { uuid: "custody-uuid" },
    } as never);
    vi.mocked(mockedRiskService.assertWithdrawalWithinLimits).mockRejectedValue(
      new RiskError("O valor do saque excede o limite por operacao.", 403),
    );
    mockedPrisma.$transaction.mockImplementation(async (callback) =>
      callback({
        payment: {
          aggregate: vi.fn().mockResolvedValue({
            _sum: {
              amount: new Prisma.Decimal(0),
            },
          }),
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
      } as never),
    );

    await expect(
      paymentService.createWithdrawal({
        userUuid: "user-uuid",
        amount: 100,
      }),
    ).rejects.toThrowError(new RiskError("O valor do saque excede o limite por operacao.", 403));
  });

  it("returns the existing payment when the idempotency key is reused with the same payload", async () => {
    mockedPrisma.payment.findFirst.mockResolvedValue({
      uuid: "payment-uuid",
      userUuid: "user-uuid",
      type: "deposit",
      status: "completed",
      provider: "manual",
      idempotencyKey: "dep-001",
      amount: new Prisma.Decimal("100.0000"),
      currency: "USD",
      description: "Manual top-up",
      metadata: null,
      ledgerTransactionUuid: "ledger-tx-uuid",
      createdAt: new Date("2026-03-27T12:00:00.000Z"),
      updatedAt: new Date("2026-03-27T12:01:00.000Z"),
      processedAt: new Date("2026-03-27T12:01:00.000Z"),
    } as never);

    await expect(
      paymentService.createDeposit({
        userUuid: "user-uuid",
        amount: "100.0000",
        currency: "USD",
        description: "Manual top-up",
        idempotencyKey: "dep-001",
      }),
    ).resolves.toMatchObject({
      uuid: "payment-uuid",
      idempotencyKey: "dep-001",
      status: "completed",
    });

    expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("blocks withdrawals when the account is not operationally active", async () => {
    vi.mocked(mockedAccountStateService.assertCanCreateWithdrawal).mockRejectedValue(
      new AccountStateError(
        "A conta precisa estar ativa para saques. Conclua a verificacao ou contate o suporte.",
        403,
      ),
    );

    await expect(
      paymentService.createWithdrawal({
        userUuid: "user-uuid",
        amount: 10,
      }),
    ).rejects.toThrowError(
      new AccountStateError(
        "A conta precisa estar ativa para saques. Conclua a verificacao ou contate o suporte.",
        403,
      ),
    );

    expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects idempotency key reuse with a different payload", async () => {
    mockedPrisma.payment.findFirst.mockResolvedValue({
      uuid: "payment-uuid",
      userUuid: "user-uuid",
      type: "deposit",
      status: "completed",
      provider: "manual",
      idempotencyKey: "dep-001",
      amount: new Prisma.Decimal("100.0000"),
      currency: "USD",
      description: "Original description",
      metadata: null,
      ledgerTransactionUuid: "ledger-tx-uuid",
      createdAt: new Date("2026-03-27T12:00:00.000Z"),
      updatedAt: new Date("2026-03-27T12:01:00.000Z"),
      processedAt: new Date("2026-03-27T12:01:00.000Z"),
    } as never);

    await expect(
      paymentService.createDeposit({
        userUuid: "user-uuid",
        amount: "100.0000",
        currency: "USD",
        description: "Changed description",
        idempotencyKey: "dep-001",
      }),
    ).rejects.toThrowError(new PaymentError("Idempotency-Key ja utilizado com payload diferente.", 409));
  });

  it("lists payments by type and currency", async () => {
    mockedPrisma.payment.findMany.mockResolvedValue([
      {
        uuid: "payment-uuid",
        userUuid: "user-uuid",
        type: "deposit",
        status: "completed",
        provider: "manual",
        idempotencyKey: "dep-002",
        amount: new Prisma.Decimal("75.5000"),
        currency: "USD",
        description: null,
        metadata: { source: "mock" },
        ledgerTransactionUuid: "ledger-tx-uuid",
        createdAt: new Date("2026-03-27T12:00:00.000Z"),
        updatedAt: new Date("2026-03-27T12:01:00.000Z"),
        processedAt: new Date("2026-03-27T12:01:00.000Z"),
      },
    ] as never);

    await expect(
      paymentService.listPayments({
        userUuid: "user-uuid",
        type: "deposit",
        limit: 20,
      }),
    ).resolves.toEqual({
      items: [
        {
          uuid: "payment-uuid",
          type: "deposit",
          status: "completed",
          provider: "manual",
          idempotencyKey: "dep-002",
          amount: "75.5000",
          currency: "USD",
          description: null,
          ledgerTransactionUuid: "ledger-tx-uuid",
          createdAt: new Date("2026-03-27T12:00:00.000Z"),
          updatedAt: new Date("2026-03-27T12:01:00.000Z"),
          processedAt: new Date("2026-03-27T12:01:00.000Z"),
          metadata: { source: "mock" },
        },
      ],
      meta: {
        count: 1,
        limit: 20,
        type: "deposit",
        currency: "USD",
      },
    });
  });
});
