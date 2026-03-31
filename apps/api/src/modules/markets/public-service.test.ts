import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { MarketCatalogError, MarketCatalogService } from "./public-service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    market: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    order: {
      groupBy: vi.fn(),
    },
  },
}));

const marketFixture = {
  uuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
  slug: "fed-cuts-rates",
  title: "Fed cuts rates in June",
  category: "macro",
  status: "open",
  outcomeType: "binary",
  contractValue: new Prisma.Decimal("1.00"),
  tickSize: 1,
  openAt: new Date("2026-06-01T10:00:00.000Z"),
  closeAt: new Date("2026-06-18T21:00:00.000Z"),
  createdAt: new Date("2026-03-27T10:00:00.000Z"),
  updatedAt: new Date("2026-03-27T10:00:00.000Z"),
  rules: {
    marketUuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
    officialSourceLabel: "Federal Reserve statement",
    officialSourceUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
    resolutionRules: "Resolves YES if the Fed announces a rate cut.",
    createdAt: new Date("2026-03-27T10:00:00.000Z"),
    updatedAt: new Date("2026-03-27T10:00:00.000Z"),
  },
};

describe("MarketCatalogService", () => {
  const marketCatalogService = new MarketCatalogService();
  const mockedPrisma = vi.mocked(prisma, true);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists public markets with filters", async () => {
    mockedPrisma.market.findMany.mockResolvedValue([marketFixture] as never);

    await expect(
      marketCatalogService.listMarkets({
        status: "open",
        category: "macro",
        closeAtFrom: new Date("2026-06-01T00:00:00.000Z"),
        closeAtTo: new Date("2026-06-30T23:59:59.000Z"),
      }),
    ).resolves.toMatchObject([
      {
        uuid: marketFixture.uuid,
        status: "open",
        rules: {
          officialSourceLabel: "Federal Reserve statement",
        },
      },
    ]);
  });

  it("rejects invalid closing date range", async () => {
    await expect(
      marketCatalogService.listMarkets({
        closeAtFrom: new Date("2026-07-01T00:00:00.000Z"),
        closeAtTo: new Date("2026-06-01T00:00:00.000Z"),
      }),
    ).rejects.toThrowError(
      new MarketCatalogError("A data inicial de vencimento deve ser anterior a data final.", 400),
    );
  });

  it("returns a single public market by uuid", async () => {
    mockedPrisma.market.findUnique.mockResolvedValue(marketFixture as never);

    await expect(marketCatalogService.getMarket(marketFixture.uuid)).resolves.toMatchObject({
      uuid: marketFixture.uuid,
      slug: marketFixture.slug,
    });
  });

  it("returns 404 when market is missing", async () => {
    mockedPrisma.market.findUnique.mockResolvedValue(null);

    await expect(marketCatalogService.getMarket(marketFixture.uuid)).rejects.toThrowError(
      new MarketCatalogError("Mercado nao encontrado.", 404),
    );
  });

  it("returns the aggregated order book for a market", async () => {
    mockedPrisma.market.findUnique.mockResolvedValue({
      uuid: marketFixture.uuid,
      status: "open",
    } as never);
    mockedPrisma.order.groupBy.mockResolvedValue([
      {
        side: "buy",
        outcome: "YES",
        price: 55,
        _sum: {
          remainingQuantity: 12,
        },
        _count: {
          _all: 2,
        },
      },
      {
        side: "sell",
        outcome: "YES",
        price: 60,
        _sum: {
          remainingQuantity: 7,
        },
        _count: {
          _all: 1,
        },
      },
    ] as never);

    await expect(marketCatalogService.getOrderBook(marketFixture.uuid)).resolves.toEqual({
      marketUuid: marketFixture.uuid,
      marketStatus: "open",
      levels: [
        {
          side: "buy",
          outcome: "YES",
          price: 55,
          quantity: 12,
          orderCount: 2,
        },
        {
          side: "sell",
          outcome: "YES",
          price: 60,
          quantity: 7,
          orderCount: 1,
        },
      ],
    });
  });
});
