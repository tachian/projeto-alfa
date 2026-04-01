import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { resetMetrics, renderMetrics } from "../../lib/metrics.js";
import { ReconciliationService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    ledgerEntry: {
      groupBy: vi.fn(),
    },
    account: {
      findMany: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
    market: {
      findMany: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
    },
  },
}));

describe("ReconciliationService", () => {
  const reconciliationService = new ReconciliationService();
  const mockedPrisma = vi.mocked(prisma, true);

  beforeEach(() => {
    vi.clearAllMocks();
    resetMetrics();
    mockedPrisma.ledgerEntry.groupBy.mockResolvedValue([
      {
        direction: "debit",
        _sum: {
          amount: new Prisma.Decimal("10.0000"),
        },
      },
      {
        direction: "credit",
        _sum: {
          amount: new Prisma.Decimal("10.0000"),
        },
      },
    ] as never);
    mockedPrisma.account.findMany.mockResolvedValue([
      {
        uuid: "reserved-account-uuid",
        userUuid: "user-uuid",
      },
    ] as never);
    mockedPrisma.order.findMany.mockResolvedValue([] as never);
    mockedPrisma.market.findMany.mockResolvedValue([] as never);
    mockedPrisma.payment.findMany.mockResolvedValue([] as never);
  });

  it("generates an ok reconciliation report and updates metrics", async () => {
    mockedPrisma.ledgerEntry.groupBy
      .mockResolvedValueOnce([
        {
          direction: "debit",
          _sum: {
            amount: new Prisma.Decimal("10.0000"),
          },
        },
        {
          direction: "credit",
          _sum: {
            amount: new Prisma.Decimal("10.0000"),
          },
        },
      ] as never)
      .mockResolvedValueOnce([] as never);

    const report = await reconciliationService.generateReport();

    expect(report.summary.status).toBe("ok");
    expect(report.summary.criticals).toBe(0);
    expect(report.summary.warnings).toBe(0);
    expect(renderMetrics()).toContain("projeto_alfa_reconciliation_check_status");
  });

  it("marks the report as critical when reserved collateral diverges from open orders", async () => {
    mockedPrisma.ledgerEntry.groupBy
      .mockResolvedValueOnce([
        {
          direction: "debit",
          _sum: {
            amount: new Prisma.Decimal("10.0000"),
          },
        },
        {
          direction: "credit",
          _sum: {
            amount: new Prisma.Decimal("10.0000"),
          },
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          accountUuid: "reserved-account-uuid",
          direction: "credit",
          _sum: {
            amount: new Prisma.Decimal("5.0000"),
          },
        },
      ] as never);
    mockedPrisma.order.findMany.mockResolvedValue([
      {
        userUuid: "user-uuid",
        side: "buy",
        price: 20,
        remainingQuantity: 10,
      },
    ] as never);

    const report = await reconciliationService.generateReport();

    expect(report.summary.status).toBe("critical");
    expect(report.checks.find((check) => check.check === "reserved_collateral_coverage")).toMatchObject({
      status: "critical",
    });
  });
});
