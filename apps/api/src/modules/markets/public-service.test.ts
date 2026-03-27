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
});
