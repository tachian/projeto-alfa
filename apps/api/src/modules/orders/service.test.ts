import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { LedgerService } from "../ledger/service.js";
import { OrderError, OrderService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    market: {
      findUnique: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
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
  const mockedLedgerService = {
    ensureUserAccounts: vi.fn(),
    getAccountBalance: vi.fn(),
    postTransaction: vi.fn(),
  } as unknown as LedgerService;

  const orderService = new OrderService(mockedLedgerService);
  const mockedPrisma = vi.mocked(prisma, true);
  const mockedWriteAuditLog = vi.mocked(writeAuditLog);

  const transactionClient = {
    account: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    ledgerEntry: {
      groupBy: vi.fn(),
      create: vi.fn(),
    },
    ledgerTransaction: {
      create: vi.fn(),
    },
    order: {
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.$transaction.mockImplementation(async (callback) => callback(transactionClient as never));
    vi.mocked(mockedLedgerService.ensureUserAccounts).mockResolvedValue({
      available: { uuid: "available-uuid" },
      reserved: { uuid: "reserved-uuid" },
    } as never);
    vi.mocked(mockedLedgerService.getAccountBalance).mockResolvedValue({
      accountUuid: "available-uuid",
      currency: "USD",
      available: "100.0000",
    });
    vi.mocked(mockedLedgerService.postTransaction).mockResolvedValue({
      transaction: { uuid: "ledger-tx-uuid" },
      entries: [],
    } as never);
  });

  it("creates an order for an open market and reserves funds", async () => {
    mockedPrisma.market.findUnique.mockResolvedValue(marketFixture as never);
    transactionClient.order.create.mockResolvedValue(orderFixture as never);

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

    expect(vi.mocked(mockedLedgerService.postTransaction)).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionType: "order_reserve",
        referenceType: "order",
        referenceUuid: orderFixture.uuid,
        entries: [
          expect.objectContaining({
            accountUuid: "available-uuid",
            direction: "debit",
            amount: new Prisma.Decimal("5.5"),
          }),
          expect.objectContaining({
            accountUuid: "reserved-uuid",
            direction: "credit",
            amount: new Prisma.Decimal("5.5"),
          }),
        ],
      }),
      expect.objectContaining({
        skipAuditLog: true,
      }),
    );
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

  it("cancels an open order and releases reserved funds", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(orderFixture as never);
    transactionClient.order.update.mockResolvedValue({
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

    expect(vi.mocked(mockedLedgerService.postTransaction)).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionType: "order_release",
        referenceType: "order",
        referenceUuid: orderFixture.uuid,
        entries: [
          expect.objectContaining({
            accountUuid: "reserved-uuid",
            direction: "debit",
            amount: new Prisma.Decimal("5.5"),
          }),
          expect.objectContaining({
            accountUuid: "available-uuid",
            direction: "credit",
            amount: new Prisma.Decimal("5.5"),
          }),
        ],
      }),
      expect.objectContaining({
        skipAuditLog: true,
      }),
    );
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

  it("rejects order creation when available balance is insufficient", async () => {
    mockedPrisma.market.findUnique.mockResolvedValue(marketFixture as never);
    vi.mocked(mockedLedgerService.getAccountBalance).mockResolvedValue({
      accountUuid: "available-uuid",
      currency: "USD",
      available: "1.0000",
    });

    await expect(
      orderService.createOrder({
        userUuid: "user-uuid",
        marketUuid: marketFixture.uuid,
        side: "buy",
        outcome: "YES",
        price: 55,
        quantity: 10,
      }),
    ).rejects.toThrowError(new OrderError("Saldo insuficiente para reservar a ordem.", 400));
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
