import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { LedgerService } from "../ledger/service.js";
import { SettlementError, SettlementService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    $transaction: vi.fn(),
    market: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    marketResolution: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    settlementRun: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    position: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    positionSettlement: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../../lib/audit.js", () => ({
  writeAuditLog: vi.fn(),
}));

describe("SettlementService", () => {
  const mockedLedgerService = {
    ensurePlatformAccounts: vi.fn(),
    ensureUserAccounts: vi.fn(),
    postTransaction: vi.fn(),
  } as unknown as LedgerService;
  const settlementService = new SettlementService(mockedLedgerService);
  const mockedPrisma = vi.mocked(prisma, true);
  const mockedWriteAuditLog = vi.mocked(writeAuditLog);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.$transaction.mockImplementation(async (callback) =>
      callback({
        market: mockedPrisma.market,
        marketResolution: mockedPrisma.marketResolution,
        settlementRun: mockedPrisma.settlementRun,
        position: mockedPrisma.position,
        positionSettlement: mockedPrisma.positionSettlement,
      } as never));
    vi.mocked(mockedLedgerService.ensurePlatformAccounts).mockResolvedValue({
      custody: {
        uuid: "custody-uuid",
      },
    } as never);
    vi.mocked(mockedLedgerService.ensureUserAccounts).mockResolvedValue({
      available: {
        uuid: "available-uuid",
      },
    } as never);
    vi.mocked(mockedLedgerService.postTransaction).mockResolvedValue({
      transaction: {
        uuid: "ledger-transaction-uuid",
      },
      entries: [],
    } as never);
  });

  it("creates and lists market resolutions", async () => {
    mockedPrisma.market.findUnique.mockResolvedValue({
      uuid: "market-uuid",
    } as never);
    mockedPrisma.marketResolution.create.mockResolvedValue({
      uuid: "resolution-uuid",
      marketUuid: "market-uuid",
      winningOutcome: "YES",
      sourceValue: "Fed cut rates",
      status: "resolved",
      notes: "Official release confirmed.",
      resolvedByUserUuid: "admin-uuid",
      resolvedAt: new Date("2026-06-18T21:05:00.000Z"),
      createdAt: new Date("2026-06-18T21:05:00.000Z"),
      updatedAt: new Date("2026-06-18T21:05:00.000Z"),
    } as never);
    mockedPrisma.market.update.mockResolvedValue({
      uuid: "market-uuid",
      status: "resolved",
    } as never);
    mockedPrisma.marketResolution.findMany.mockResolvedValue([
      {
        uuid: "resolution-uuid",
        marketUuid: "market-uuid",
        winningOutcome: "YES",
        sourceValue: "Fed cut rates",
        status: "resolved",
        notes: "Official release confirmed.",
        resolvedByUserUuid: "admin-uuid",
        resolvedAt: new Date("2026-06-18T21:05:00.000Z"),
        createdAt: new Date("2026-06-18T21:05:00.000Z"),
        updatedAt: new Date("2026-06-18T21:05:00.000Z"),
      },
    ] as never);

    await expect(
      settlementService.createMarketResolution({
        marketUuid: "market-uuid",
        winningOutcome: "YES",
        sourceValue: "Fed cut rates",
        status: "resolved",
        notes: "Official release confirmed.",
        resolvedByUserUuid: "admin-uuid",
      }),
    ).resolves.toMatchObject({
      uuid: "resolution-uuid",
      status: "resolved",
    });

    await expect(settlementService.listMarketResolutions("market-uuid")).resolves.toEqual([
      expect.objectContaining({
        uuid: "resolution-uuid",
        winningOutcome: "YES",
      }),
    ]);
    expect(mockedPrisma.market.update).toHaveBeenCalledWith({
      where: {
        uuid: "market-uuid",
      },
      data: {
        status: "resolved",
      },
    });
    expect(mockedWriteAuditLog).toHaveBeenCalledWith({
      action: "settlement.resolution.created",
      targetType: "market_resolution",
      targetUuid: "resolution-uuid",
      actorUuid: "admin-uuid",
      payload: {
        marketUuid: "market-uuid",
        status: "resolved",
        winningOutcome: "YES",
      },
    });
  });

  it("creates, updates and lists settlement runs", async () => {
    mockedPrisma.settlementRun.create.mockResolvedValue({
      uuid: "run-uuid",
      marketUuid: "market-uuid",
      marketResolutionUuid: "resolution-uuid",
      status: "pending",
      contractsProcessed: 0,
      totalPayout: new Prisma.Decimal("0"),
      metadata: null,
      startedAt: new Date("2026-06-18T21:10:00.000Z"),
      finishedAt: null,
      createdAt: new Date("2026-06-18T21:10:00.000Z"),
      updatedAt: new Date("2026-06-18T21:10:00.000Z"),
    } as never);
    mockedPrisma.settlementRun.findUnique.mockResolvedValue({
      uuid: "run-uuid",
      marketUuid: "market-uuid",
      marketResolutionUuid: "resolution-uuid",
      status: "pending",
      contractsProcessed: 0,
      totalPayout: new Prisma.Decimal("0"),
      metadata: null,
      startedAt: new Date("2026-06-18T21:10:00.000Z"),
      finishedAt: null,
      createdAt: new Date("2026-06-18T21:10:00.000Z"),
      updatedAt: new Date("2026-06-18T21:10:00.000Z"),
    } as never);
    mockedPrisma.settlementRun.update.mockResolvedValue({
      uuid: "run-uuid",
      marketUuid: "market-uuid",
      marketResolutionUuid: "resolution-uuid",
      status: "completed",
      contractsProcessed: 42,
      totalPayout: new Prisma.Decimal("12.5000"),
      metadata: {
        dryRun: false,
      },
      startedAt: new Date("2026-06-18T21:10:00.000Z"),
      finishedAt: new Date("2026-06-18T21:15:00.000Z"),
      createdAt: new Date("2026-06-18T21:10:00.000Z"),
      updatedAt: new Date("2026-06-18T21:15:00.000Z"),
    } as never);
    mockedPrisma.settlementRun.findMany.mockResolvedValue([
      {
        uuid: "run-uuid",
        marketUuid: "market-uuid",
        marketResolutionUuid: "resolution-uuid",
        status: "completed",
        contractsProcessed: 42,
        totalPayout: new Prisma.Decimal("12.5000"),
        metadata: {
          dryRun: false,
        },
        startedAt: new Date("2026-06-18T21:10:00.000Z"),
        finishedAt: new Date("2026-06-18T21:15:00.000Z"),
        createdAt: new Date("2026-06-18T21:10:00.000Z"),
        updatedAt: new Date("2026-06-18T21:15:00.000Z"),
      },
    ] as never);

    await expect(
      settlementService.createSettlementRun({
        createdByUserUuid: "admin-uuid",
        marketUuid: "market-uuid",
        marketResolutionUuid: "resolution-uuid",
      }),
    ).resolves.toMatchObject({
      uuid: "run-uuid",
      status: "pending",
      totalPayout: "0.0000",
    });

    await expect(
      settlementService.updateSettlementRun({
        settlementRunUuid: "run-uuid",
        updatedByUserUuid: "admin-uuid",
        status: "completed",
        contractsProcessed: 42,
        totalPayout: "12.5",
        metadata: {
          dryRun: false,
        },
        finishedAt: new Date("2026-06-18T21:15:00.000Z"),
      }),
    ).resolves.toMatchObject({
      uuid: "run-uuid",
      status: "completed",
      totalPayout: "12.5000",
    });

    await expect(settlementService.listSettlementRuns("market-uuid")).resolves.toEqual([
      expect.objectContaining({
        uuid: "run-uuid",
        contractsProcessed: 42,
      }),
    ]);
    expect(mockedWriteAuditLog).toHaveBeenCalledWith({
      action: "settlement.run.updated",
      targetType: "settlement_run",
      targetUuid: "run-uuid",
      actorUuid: "admin-uuid",
      payload: {
        previousStatus: "pending",
        status: "completed",
        contractsProcessed: 42,
        totalPayout: "12.5000",
      },
    });
  });

  it("returns 404 when updating a missing settlement run", async () => {
    mockedPrisma.settlementRun.findUnique.mockResolvedValue(null);

    await expect(
      settlementService.updateSettlementRun({
        settlementRunUuid: "missing-run-uuid",
        status: "completed",
      }),
    ).rejects.toThrowError(new SettlementError("Settlement run nao encontrado.", 404));
  });

  it("returns 404 when creating a resolution for a missing market", async () => {
    mockedPrisma.market.findUnique.mockResolvedValue(null);

    await expect(
      settlementService.createMarketResolution({
        marketUuid: "missing-market-uuid",
        status: "pending",
      }),
    ).rejects.toThrowError(new SettlementError("Mercado nao encontrado para resolucao.", 404));
  });

  it("settles winning and losing positions in the ledger and closes the positions", async () => {
    mockedPrisma.settlementRun.findUnique.mockResolvedValue({
      uuid: "run-uuid",
      marketUuid: "market-uuid",
      marketResolutionUuid: "resolution-uuid",
      status: "pending",
      contractsProcessed: 0,
      totalPayout: new Prisma.Decimal("0"),
      metadata: null,
      startedAt: new Date("2026-06-18T21:10:00.000Z"),
      finishedAt: null,
      createdAt: new Date("2026-06-18T21:10:00.000Z"),
      updatedAt: new Date("2026-06-18T21:10:00.000Z"),
      market: {
        uuid: "market-uuid",
        contractValue: new Prisma.Decimal("1.00"),
      },
      marketResolution: {
        uuid: "resolution-uuid",
        status: "resolved",
        winningOutcome: "YES",
      },
    } as never);
    mockedPrisma.position.findMany.mockResolvedValue([
      {
        uuid: "winner-position-uuid",
        userUuid: "winner-user-uuid",
        marketUuid: "market-uuid",
        outcome: "YES",
        netQuantity: 3,
        averageEntryPrice: new Prisma.Decimal("60.0000"),
        realizedPnl: new Prisma.Decimal("0"),
      },
      {
        uuid: "loser-position-uuid",
        userUuid: "loser-user-uuid",
        marketUuid: "market-uuid",
        outcome: "YES",
        netQuantity: -3,
        averageEntryPrice: new Prisma.Decimal("60.0000"),
        realizedPnl: new Prisma.Decimal("0"),
      },
    ] as never);
    mockedPrisma.position.update
      .mockResolvedValueOnce({ uuid: "winner-position-uuid" } as never)
      .mockResolvedValueOnce({ uuid: "loser-position-uuid" } as never);
    mockedPrisma.positionSettlement.create
      .mockResolvedValueOnce({ uuid: "winner-position-settlement-uuid" } as never)
      .mockResolvedValueOnce({ uuid: "loser-position-settlement-uuid" } as never);
    mockedPrisma.settlementRun.update.mockResolvedValue({
      uuid: "run-uuid",
      marketUuid: "market-uuid",
      marketResolutionUuid: "resolution-uuid",
      status: "completed",
      contractsProcessed: 6,
      totalPayout: new Prisma.Decimal("3.0000"),
      metadata: {
        executedByUserUuid: "admin-uuid",
        winningOutcome: "YES",
      },
      startedAt: new Date("2026-06-18T21:10:00.000Z"),
      finishedAt: new Date("2026-06-18T21:15:00.000Z"),
      createdAt: new Date("2026-06-18T21:10:00.000Z"),
      updatedAt: new Date("2026-06-18T21:15:00.000Z"),
    } as never);
    vi.mocked(mockedLedgerService.ensureUserAccounts).mockImplementation(async ({ userUuid }) => ({
      available: {
        uuid: `${userUuid}-available-uuid`,
      },
    }) as never);

    await expect(
      settlementService.executeSettlementRun({
        settlementRunUuid: "run-uuid",
        executedByUserUuid: "admin-uuid",
      }),
    ).resolves.toMatchObject({
      uuid: "run-uuid",
      status: "completed",
      contractsProcessed: 6,
      totalPayout: "3.0000",
    });

    expect(vi.mocked(mockedLedgerService.postTransaction)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(mockedLedgerService.postTransaction)).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionType: "market_settlement_payout",
        referenceType: "settlement_run",
        referenceUuid: "run-uuid",
        entries: [
          expect.objectContaining({
            accountUuid: "custody-uuid",
            direction: "debit",
            amount: new Prisma.Decimal("3"),
          }),
          expect.objectContaining({
            accountUuid: "winner-user-uuid-available-uuid",
            userUuid: "winner-user-uuid",
            direction: "credit",
            amount: new Prisma.Decimal("3"),
          }),
        ],
      }),
      expect.objectContaining({
        skipAuditLog: true,
      }),
    );
    expect(mockedPrisma.position.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          uuid: "winner-position-uuid",
        },
        data: {
          netQuantity: 0,
          averageEntryPrice: new Prisma.Decimal(0),
          realizedPnl: new Prisma.Decimal("1.2000"),
        },
      }),
    );
    expect(mockedPrisma.positionSettlement.create).toHaveBeenNthCalledWith(
      1,
      {
        data: {
          settlementRunUuid: "run-uuid",
          positionUuid: "winner-position-uuid",
          userUuid: "winner-user-uuid",
          marketUuid: "market-uuid",
          outcome: "YES",
          winningOutcome: "YES",
          positionDirection: "long",
          contractsSettled: 3,
          payoutAmount: new Prisma.Decimal("3"),
          realizedPnlDelta: new Prisma.Decimal("1.2000"),
          status: "won",
        },
      },
    );
    expect(mockedPrisma.positionSettlement.create).toHaveBeenNthCalledWith(
      2,
      {
        data: {
          settlementRunUuid: "run-uuid",
          positionUuid: "loser-position-uuid",
          userUuid: "loser-user-uuid",
          marketUuid: "market-uuid",
          outcome: "YES",
          winningOutcome: "YES",
          positionDirection: "short",
          contractsSettled: 3,
          payoutAmount: new Prisma.Decimal("0"),
          realizedPnlDelta: new Prisma.Decimal("-1.2000"),
          status: "lost",
        },
      },
    );
    expect(mockedPrisma.position.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          uuid: "loser-position-uuid",
        },
        data: {
          netQuantity: 0,
          averageEntryPrice: new Prisma.Decimal(0),
          realizedPnl: new Prisma.Decimal("-1.2000"),
        },
      }),
    );
    expect(mockedWriteAuditLog).toHaveBeenCalledWith({
      action: "settlement.run.executed",
      targetType: "settlement_run",
      targetUuid: "run-uuid",
      actorUuid: "admin-uuid",
      payload: {
        marketUuid: "market-uuid",
        contractsProcessed: 6,
        totalPayout: "3.0000",
      },
    });
  });
});
