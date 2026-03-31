import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { SettlementError, SettlementService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
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
  },
}));

describe("SettlementService", () => {
  const settlementService = new SettlementService();
  const mockedPrisma = vi.mocked(prisma, true);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates and lists market resolutions", async () => {
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
});
