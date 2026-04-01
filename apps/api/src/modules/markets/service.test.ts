import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { writeAuditLog } from "../../lib/audit.js";
import { prisma } from "../../lib/prisma.js";
import { MarketAdminError, MarketAdminService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    market: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("../../lib/audit.js", () => ({
  writeAuditLog: vi.fn(),
}));

const marketFixture = {
  uuid: "market-uuid",
  slug: "fed-cuts-rates",
  title: "Fed cuts rates in June",
  category: "macro",
  status: "draft",
  outcomeType: "binary",
  contractValue: new Prisma.Decimal("1.00"),
  tickSize: 1,
  openAt: new Date("2026-06-01T10:00:00.000Z"),
  closeAt: new Date("2026-06-18T21:00:00.000Z"),
  createdAt: new Date("2026-03-27T10:00:00.000Z"),
  updatedAt: new Date("2026-03-27T10:00:00.000Z"),
  rules: {
    marketUuid: "market-uuid",
    officialSourceLabel: "Federal Reserve statement",
    officialSourceUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
    resolutionRules: "Resolves YES if the Fed announces a rate cut.",
    createdAt: new Date("2026-03-27T10:00:00.000Z"),
    updatedAt: new Date("2026-03-27T10:00:00.000Z"),
  },
};

describe("MarketAdminService", () => {
  const marketAdminService = new MarketAdminService();
  const mockedPrisma = vi.mocked(prisma, true);
  const mockedWriteAuditLog = vi.mocked(writeAuditLog);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a market with rules", async () => {
    mockedPrisma.market.create.mockResolvedValue(marketFixture as never);

    await expect(
      marketAdminService.createMarket({
        slug: "fed-cuts-rates",
        title: "Fed cuts rates in June",
        category: "macro",
        status: "draft",
        closeAt: new Date("2026-06-18T21:00:00.000Z"),
        openAt: new Date("2026-06-01T10:00:00.000Z"),
        officialSourceLabel: "Federal Reserve statement",
        officialSourceUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
        resolutionRules: "Resolves YES if the Fed announces a rate cut.",
      }),
    ).resolves.toMatchObject({
      uuid: "market-uuid",
      slug: "fed-cuts-rates",
      rules: {
        officialSourceLabel: "Federal Reserve statement",
        officialSourceUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
      },
    });

    expect(mockedWriteAuditLog).toHaveBeenCalledWith({
      action: "markets.admin.created",
      targetType: "market",
      targetUuid: "market-uuid",
      actorUuid: undefined,
      payload: {
        slug: "fed-cuts-rates",
        status: "draft",
        category: "macro",
        outcomeType: "binary",
      },
    });
  });

  it("lists admin markets", async () => {
    mockedPrisma.market.findMany.mockResolvedValue([marketFixture] as never);

    await expect(marketAdminService.listMarkets()).resolves.toHaveLength(1);
  });

  it("updates an existing market", async () => {
    mockedPrisma.market.findUnique.mockResolvedValue(marketFixture as never);
    mockedPrisma.market.update.mockResolvedValue({
      ...marketFixture,
      status: "open",
      rules: {
        ...marketFixture.rules,
        resolutionRules: "Updated rule",
      },
    } as never);

    await expect(
      marketAdminService.updateMarket({
        marketUuid: "market-uuid",
        performedByUserUuid: "admin-uuid",
        status: "open",
        resolutionRules: "Updated rule",
      }),
    ).resolves.toMatchObject({
      status: "open",
      rules: {
        resolutionRules: "Updated rule",
      },
    });
    expect(mockedWriteAuditLog).toHaveBeenCalledWith({
      action: "markets.admin.updated",
      targetType: "market",
      targetUuid: "market-uuid",
      actorUuid: "admin-uuid",
      payload: {
        previousStatus: "draft",
        slug: "fed-cuts-rates",
        status: "open",
        closeAt: "2026-06-18T21:00:00.000Z",
      },
    });
  });

  it("rejects invalid open/close chronology", async () => {
    await expect(
      marketAdminService.createMarket({
        slug: "bad-market",
        title: "Bad market",
        category: "macro",
        status: "draft",
        openAt: new Date("2026-06-20T10:00:00.000Z"),
        closeAt: new Date("2026-06-18T21:00:00.000Z"),
        officialSourceLabel: "Source",
        officialSourceUrl: "https://example.com/source",
        resolutionRules: "Rule",
      }),
    ).rejects.toThrowError(new MarketAdminError("A data de abertura deve ser anterior ao fechamento.", 400));
  });

  it("rejects invalid market state", async () => {
    await expect(
      marketAdminService.createMarket({
        slug: "bad-state-market",
        title: "Bad state market",
        category: "macro",
        status: "invalid_state",
        closeAt: new Date("2026-06-18T21:00:00.000Z"),
        officialSourceLabel: "Source",
        officialSourceUrl: "https://example.com/source",
        resolutionRules: "Rule",
      }),
    ).rejects.toThrowError(new MarketAdminError("Estado de mercado invalido.", 400));
  });

  it("deletes a market", async () => {
    mockedPrisma.market.delete.mockResolvedValue(marketFixture as never);

    await expect(marketAdminService.deleteMarket("market-uuid")).resolves.toBeUndefined();
    expect(mockedWriteAuditLog).toHaveBeenCalledWith({
      action: "markets.admin.deleted",
      targetType: "market",
      targetUuid: "market-uuid",
      actorUuid: undefined,
    });
  });
});
