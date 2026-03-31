import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { OrderError, OrderService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    market: {
      findUnique: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../../lib/audit.js", () => ({
  writeAuditLog: vi.fn(),
}));

const marketFixture = {
  uuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
  slug: "fed-cuts-rates",
  title: "Fed cuts rates in June",
  category: "macro",
  status: "open",
  outcomeType: "binary",
  contractValue: 1,
  tickSize: 1,
  openAt: new Date("2026-06-01T10:00:00.000Z"),
  closeAt: new Date("2099-06-18T21:00:00.000Z"),
  createdAt: new Date("2026-03-27T10:00:00.000Z"),
  updatedAt: new Date("2026-03-27T10:00:00.000Z"),
};

const orderFixture = {
  uuid: "c4baf11d-3367-4b8e-bfb3-8a3a7a6d3df1",
  userUuid: "user-uuid",
  marketUuid: marketFixture.uuid,
  side: "buy",
  outcome: "YES",
  orderType: "limit",
  status: "open",
  price: 55,
  quantity: 10,
  remainingQuantity: 10,
  createdAt: new Date("2026-03-30T10:00:00.000Z"),
  canceledAt: null,
  market: {
    uuid: marketFixture.uuid,
    slug: marketFixture.slug,
    title: marketFixture.title,
    status: marketFixture.status,
    closeAt: marketFixture.closeAt,
  },
};

describe("OrderService", () => {
  const orderService = new OrderService();
  const mockedPrisma = vi.mocked(prisma, true);
  const mockedWriteAuditLog = vi.mocked(writeAuditLog);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an order for an open market", async () => {
    mockedPrisma.market.findUnique.mockResolvedValue(marketFixture as never);
    mockedPrisma.order.create.mockResolvedValue(orderFixture as never);

    await expect(
      orderService.createOrder({
        userUuid: "user-uuid",
        marketUuid: marketFixture.uuid,
        side: "buy",
        outcome: "YES",
        price: 55,
        quantity: 10,
      }),
    ).resolves.toMatchObject({
      uuid: orderFixture.uuid,
      status: "open",
      market: {
        uuid: marketFixture.uuid,
      },
    });

    expect(mockedWriteAuditLog).toHaveBeenCalledWith({
      action: "orders.created",
      targetType: "order",
      targetUuid: orderFixture.uuid,
      payload: {
        marketUuid: marketFixture.uuid,
        side: "buy",
        outcome: "YES",
        price: 55,
        quantity: 10,
      },
    });
  });

  it("lists user orders", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([orderFixture] as never);

    await expect(
      orderService.listOrders({
        userUuid: "user-uuid",
        status: "open",
      }),
    ).resolves.toMatchObject({
      items: [
        {
          uuid: orderFixture.uuid,
        },
      ],
      meta: {
        count: 1,
      },
    });
  });

  it("cancels an open order", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(orderFixture as never);
    mockedPrisma.order.update.mockResolvedValue({
      ...orderFixture,
      status: "cancelled",
      canceledAt: new Date("2026-03-30T11:00:00.000Z"),
    } as never);

    await expect(
      orderService.cancelOrder({
        userUuid: "user-uuid",
        orderUuid: orderFixture.uuid,
      }),
    ).resolves.toMatchObject({
      uuid: orderFixture.uuid,
      status: "cancelled",
    });
  });

  it("rejects orders for closed markets", async () => {
    mockedPrisma.market.findUnique.mockResolvedValue({
      ...marketFixture,
      status: "closed",
    } as never);

    await expect(
      orderService.createOrder({
        userUuid: "user-uuid",
        marketUuid: marketFixture.uuid,
        side: "buy",
        outcome: "YES",
        price: 55,
        quantity: 10,
      }),
    ).rejects.toThrowError(new OrderError("O mercado nao esta aberto para negociacao.", 400));
  });

  it("rejects canceling an order from another user", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      ...orderFixture,
      userUuid: "another-user",
    } as never);

    await expect(
      orderService.cancelOrder({
        userUuid: "user-uuid",
        orderUuid: orderFixture.uuid,
      }),
    ).rejects.toThrowError(new OrderError("Ordem nao encontrada.", 404));
  });
});
