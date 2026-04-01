import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { PortfolioService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    position: {
      findMany: vi.fn(),
    },
    positionSettlement: {
      findMany: vi.fn(),
    },
    trade: {
      findMany: vi.fn(),
    },
  },
}));

describe("PortfolioService", () => {
  const portfolioService = new PortfolioService();
  const mockedPrisma = vi.mocked(prisma, true);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists positions with realized and unrealized pnl", async () => {
    mockedPrisma.position.findMany.mockResolvedValue([
      {
        uuid: "position-uuid",
        userUuid: "user-uuid",
        marketUuid: "market-uuid",
        outcome: "YES",
        netQuantity: 10,
        averageEntryPrice: new Prisma.Decimal("55.0000"),
        realizedPnl: new Prisma.Decimal("1.2500"),
        updatedAt: new Date("2026-03-31T12:00:00.000Z"),
        market: {
          uuid: "market-uuid",
          slug: "fed-cuts-rates-june",
          title: "Fed cuts rates in June",
          status: "open",
          closeAt: new Date("2026-06-18T21:00:00.000Z"),
        },
      },
    ] as never);
    mockedPrisma.trade.findMany.mockResolvedValue([
      {
        uuid: "trade-uuid",
        marketUuid: "market-uuid",
        buyOrderUuid: "buy-order-uuid",
        sellOrderUuid: "sell-order-uuid",
        price: 60,
        quantity: 4,
        executedAt: new Date("2026-03-31T12:05:00.000Z"),
      },
    ] as never);

    await expect(portfolioService.listPositions({ userUuid: "user-uuid" })).resolves.toEqual([
      expect.objectContaining({
        uuid: "position-uuid",
        averageEntryPrice: "55.0000",
        markPrice: "60.0000",
        realizedPnl: "1.2500",
        unrealizedPnl: "0.5000",
        totalPnl: "1.7500",
      }),
    ]);
  });

  it("returns pnl summary for the user portfolio", async () => {
    mockedPrisma.position.findMany.mockResolvedValue([
      {
        uuid: "position-a",
        userUuid: "user-uuid",
        marketUuid: "market-a",
        outcome: "YES",
        netQuantity: 10,
        averageEntryPrice: new Prisma.Decimal("50.0000"),
        realizedPnl: new Prisma.Decimal("1.0000"),
        updatedAt: new Date("2026-03-31T12:00:00.000Z"),
        market: {
          uuid: "market-a",
          slug: "market-a",
          title: "Market A",
          status: "open",
          closeAt: new Date("2026-06-18T21:00:00.000Z"),
        },
      },
      {
        uuid: "position-b",
        userUuid: "user-uuid",
        marketUuid: "market-b",
        outcome: "NO",
        netQuantity: -5,
        averageEntryPrice: new Prisma.Decimal("40.0000"),
        realizedPnl: new Prisma.Decimal("-0.5000"),
        updatedAt: new Date("2026-03-31T12:00:00.000Z"),
        market: {
          uuid: "market-b",
          slug: "market-b",
          title: "Market B",
          status: "open",
          closeAt: new Date("2026-06-18T21:00:00.000Z"),
        },
      },
    ] as never);
    mockedPrisma.trade.findMany.mockResolvedValue([
      {
        uuid: "trade-a",
        marketUuid: "market-a",
        buyOrderUuid: "buy-order-a",
        sellOrderUuid: "sell-order-a",
        price: 55,
        quantity: 1,
        executedAt: new Date("2026-03-31T12:05:00.000Z"),
      },
      {
        uuid: "trade-b",
        marketUuid: "market-b",
        buyOrderUuid: "buy-order-b",
        sellOrderUuid: "sell-order-b",
        price: 35,
        quantity: 1,
        executedAt: new Date("2026-03-31T12:04:00.000Z"),
      },
    ] as never);

    await expect(portfolioService.getPnlSummary("user-uuid")).resolves.toEqual({
      realizedPnl: "0.5000",
      unrealizedPnl: "0.7500",
      totalPnl: "1.2500",
      openPositions: 2,
    });
  });

  it("lists settlement history for the user portfolio", async () => {
    mockedPrisma.positionSettlement.findMany.mockResolvedValue([
      {
        uuid: "position-settlement-uuid",
        settlementRunUuid: "run-uuid",
        marketUuid: "market-uuid",
        outcome: "YES",
        winningOutcome: "YES",
        positionDirection: "long",
        contractsSettled: 3,
        payoutAmount: new Prisma.Decimal("3.0000"),
        realizedPnlDelta: new Prisma.Decimal("1.2000"),
        status: "won",
        createdAt: new Date("2026-06-18T21:15:00.000Z"),
        market: {
          uuid: "market-uuid",
          slug: "fed-cuts-rates-june",
          title: "Fed cuts rates in June",
          status: "resolved",
          closeAt: new Date("2026-06-18T21:00:00.000Z"),
        },
      },
    ] as never);

    await expect(portfolioService.listSettlements({ userUuid: "user-uuid", limit: 20 })).resolves.toEqual([
      {
        uuid: "position-settlement-uuid",
        settlementRunUuid: "run-uuid",
        marketUuid: "market-uuid",
        outcome: "YES",
        winningOutcome: "YES",
        positionDirection: "long",
        contractsSettled: 3,
        payoutAmount: "3.0000",
        realizedPnlDelta: "1.2000",
        status: "won",
        createdAt: new Date("2026-06-18T21:15:00.000Z"),
        market: {
          uuid: "market-uuid",
          slug: "fed-cuts-rates-june",
          title: "Fed cuts rates in June",
          status: "resolved",
          closeAt: new Date("2026-06-18T21:00:00.000Z"),
        },
      },
    ]);
  });
});
