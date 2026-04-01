import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { RiskError, RiskService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
    },
    position: {
      findMany: vi.fn(),
    },
    payment: {
      aggregate: vi.fn(),
    },
  },
}));

describe("RiskService", () => {
  const mockedPrisma = vi.mocked(prisma, true);
  const riskService = new RiskService({
    NODE_ENV: "test",
    PORT: 4000,
    HOST: "0.0.0.0",
    APP_NAME: "projeto-alfa-api",
    APP_URL: "http://localhost:4000",
    LOG_LEVEL: "silent",
    DATABASE_URL: "postgres://postgres:teste123@127.0.0.1:5432/projeto_alfa",
    REDIS_URL: "redis://127.0.0.1:6379",
    RABBITMQ_URL: "amqp://admin:admin@127.0.0.1:5672",
    JWT_SECRET: "secret-123",
    JWT_REFRESH_SECRET: "refresh-secret-123",
    JWT_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "7d",
    KYC_PROVIDER: "mock",
    KYC_MOCK_DEFAULT_STATUS: "approved",
    PROMETHEUS_PORT: 9464,
    RISK_MAX_ORDER_QUANTITY: 10,
    RISK_MAX_ORDER_RESERVE_AMOUNT: 100,
    RISK_MAX_OPEN_ORDERS_PER_MARKET: 2,
    RISK_MAX_GROSS_EXPOSURE_PER_MARKET: 15,
    RISK_MAX_WITHDRAWAL_AMOUNT: 1000,
    RISK_MAX_DAILY_WITHDRAWAL_AMOUNT: 1500,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.order.findMany.mockResolvedValue([] as never);
    mockedPrisma.position.findMany.mockResolvedValue([] as never);
    mockedPrisma.payment.aggregate.mockResolvedValue({
      _sum: {
        amount: new Prisma.Decimal(0),
      },
    } as never);
  });

  it("blocks an order that exceeds the max quantity per order", async () => {
    await expect(
      riskService.assertOrderWithinLimits({
        userUuid: "user-uuid",
        marketUuid: "market-uuid",
        reserveAmount: new Prisma.Decimal("25.0000"),
        quantity: 11,
      }),
    ).rejects.toThrowError(new RiskError("A quantidade excede o limite por ordem.", 403));
  });

  it("blocks an order when open orders already hit the per-market limit", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([
      { remainingQuantity: 1 },
      { remainingQuantity: 2 },
    ] as never);

    await expect(
      riskService.assertOrderWithinLimits({
        userUuid: "user-uuid",
        marketUuid: "market-uuid",
        reserveAmount: new Prisma.Decimal("25.0000"),
        quantity: 1,
      }),
    ).rejects.toThrowError(new RiskError("Voce atingiu o limite de ordens abertas neste mercado.", 403));
  });

  it("blocks an order when projected gross exposure exceeds the market limit", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([{ remainingQuantity: 4 }] as never);
    mockedPrisma.position.findMany.mockResolvedValue([{ netQuantity: 8 }] as never);

    await expect(
      riskService.assertOrderWithinLimits({
        userUuid: "user-uuid",
        marketUuid: "market-uuid",
        reserveAmount: new Prisma.Decimal("25.0000"),
        quantity: 4,
      }),
    ).rejects.toThrowError(new RiskError("A ordem ultrapassa o limite de exposicao bruta neste mercado.", 403));
  });

  it("blocks a withdrawal when the daily limit would be exceeded", async () => {
    mockedPrisma.payment.aggregate.mockResolvedValue({
      _sum: {
        amount: new Prisma.Decimal("1000.0000"),
      },
    } as never);

    await expect(
      riskService.assertWithdrawalWithinLimits({
        userUuid: "user-uuid",
        amount: new Prisma.Decimal("600.0000"),
        currency: "USD",
        now: new Date("2026-04-01T12:00:00.000Z"),
      }),
    ).rejects.toThrowError(new RiskError("O limite diario de saques foi excedido para esta conta.", 403));
  });
});
