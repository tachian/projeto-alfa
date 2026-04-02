import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import type {
  MarketCatalogServiceContract,
  MarketOrderBookRecord,
  MarketTradeRecord,
  PublicMarketRecord,
} from "../markets/public-service.js";
import { MarketCatalogError } from "../markets/public-service.js";
import type {
  CreateOrderInput,
  ListOrdersInput,
  ListOrdersResult,
  OrderRecord,
  OrderServiceContract,
} from "./service.js";
import { OrderError } from "./service.js";

const testDependenciesPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate("appConfig", appConfig);
  fastify.decorate(
    "redis",
    {
      ping: async () => "PONG",
      quit: async () => "OK",
    } as unknown as Redis,
  );
  fastify.decorate(
    "amqp",
    {
      createChannel: async () =>
        ({
          close: async () => undefined,
        }) as unknown as Awaited<ReturnType<ChannelModel["createChannel"]>>,
      close: async () => undefined,
    } as unknown as ChannelModel,
  );
  fastify.decorate("dependencyHealth", {
    redis: "up",
    rabbitmq: "up",
  });
});

const marketFixture: PublicMarketRecord = {
  uuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
  slug: "fed-cuts-rates-june",
  title: "Fed cuts rates in June",
  category: "macro",
  status: "open",
  outcomeType: "binary",
  contractValue: "1.00",
  tickSize: 1,
  openAt: new Date("2026-06-01T10:00:00.000Z"),
  closeAt: new Date("2099-06-18T21:00:00.000Z"),
  createdAt: new Date("2026-03-31T10:00:00.000Z"),
  updatedAt: new Date("2026-03-31T10:00:00.000Z"),
  rules: {
    officialSourceLabel: "Federal Reserve statement",
    officialSourceUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
    resolutionRules: "Resolves YES if the Fed announces a rate cut.",
    createdAt: new Date("2026-03-31T10:00:00.000Z"),
    updatedAt: new Date("2026-03-31T10:00:00.000Z"),
  },
};

const cloneMarket = (): PublicMarketRecord => ({
  ...marketFixture,
  openAt: marketFixture.openAt ? new Date(marketFixture.openAt) : null,
  closeAt: new Date(marketFixture.closeAt),
  createdAt: new Date(marketFixture.createdAt),
  updatedAt: new Date(marketFixture.updatedAt),
  rules: {
    ...marketFixture.rules,
    createdAt: new Date(marketFixture.rules.createdAt),
    updatedAt: new Date(marketFixture.rules.updatedAt),
  },
});

const cloneOrder = (order: OrderRecord): OrderRecord => ({
  ...order,
  createdAt: new Date(order.createdAt),
  canceledAt: order.canceledAt ? new Date(order.canceledAt) : null,
  market: {
    ...order.market,
    closeAt: new Date(order.market.closeAt),
  },
});

const cloneTrade = (trade: MarketTradeRecord): MarketTradeRecord => ({
  ...trade,
  executedAt: new Date(trade.executedAt),
});

class InMemoryTradingService implements OrderServiceContract, MarketCatalogServiceContract {
  private readonly orders = new Map<string, OrderRecord>();
  private readonly trades: MarketTradeRecord[] = [];

  async createOrder(input: CreateOrderInput): Promise<OrderRecord> {
    if (input.marketUuid !== marketFixture.uuid) {
      throw new OrderError("Mercado nao encontrado.", 404);
    }

    const orderUuid = crypto.randomUUID();
    const createdAt = new Date();
    const nextOrder: OrderRecord = {
      uuid: orderUuid,
      userUuid: input.userUuid,
      marketUuid: input.marketUuid,
      side: input.side,
      outcome: input.outcome,
      orderType: input.orderType ?? "limit",
      status: "open",
      price: input.price,
      quantity: input.quantity,
      remainingQuantity: input.quantity,
      createdAt,
      canceledAt: null,
      market: {
        uuid: marketFixture.uuid,
        slug: marketFixture.slug,
        title: marketFixture.title,
        status: marketFixture.status,
        closeAt: marketFixture.closeAt,
      },
    };

    this.orders.set(orderUuid, nextOrder);

    const restingOrder = Array.from(this.orders.values())
      .filter((order) => order.uuid !== orderUuid)
      .filter((order) => order.marketUuid === input.marketUuid)
      .filter((order) => order.outcome === input.outcome)
      .filter((order) => order.side === (input.side === "buy" ? "sell" : "buy"))
      .filter((order) => ["open", "partially_filled"].includes(order.status))
      .filter((order) => order.userUuid !== input.userUuid)
      .filter((order) => (input.side === "buy" ? order.price <= input.price : order.price >= input.price))
      .sort((left, right) => {
        if (input.side === "buy") {
          return left.price - right.price || left.createdAt.getTime() - right.createdAt.getTime();
        }

        return right.price - left.price || left.createdAt.getTime() - right.createdAt.getTime();
      })[0];

    if (!restingOrder) {
      return cloneOrder(nextOrder);
    }

    const tradeQuantity = Math.min(nextOrder.remainingQuantity, restingOrder.remainingQuantity);
    const tradePrice = restingOrder.price;

    nextOrder.remainingQuantity -= tradeQuantity;
    nextOrder.status = nextOrder.remainingQuantity === 0 ? "filled" : "partially_filled";

    restingOrder.remainingQuantity -= tradeQuantity;
    restingOrder.status = restingOrder.remainingQuantity === 0 ? "filled" : "partially_filled";

    const trade: MarketTradeRecord = {
      uuid: crypto.randomUUID(),
      marketUuid: marketFixture.uuid,
      buyOrderUuid: input.side === "buy" ? nextOrder.uuid : restingOrder.uuid,
      sellOrderUuid: input.side === "sell" ? nextOrder.uuid : restingOrder.uuid,
      price: tradePrice,
      quantity: tradeQuantity,
      executedAt: new Date(),
    };

    this.trades.unshift(trade);

    this.orders.set(nextOrder.uuid, nextOrder);
    this.orders.set(restingOrder.uuid, restingOrder);

    return cloneOrder(nextOrder);
  }

  async listOrders(input: ListOrdersInput): Promise<ListOrdersResult> {
    const limit = input.limit ?? 50;
    const items = Array.from(this.orders.values())
      .filter((order) => order.userUuid === input.userUuid)
      .filter((order) => !input.marketUuid || order.marketUuid === input.marketUuid)
      .filter((order) => !input.status || order.status === input.status)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit)
      .map(cloneOrder);

    return {
      items,
      meta: {
        count: items.length,
        limit,
      },
    };
  }

  async cancelOrder(input: { userUuid: string; orderUuid: string }): Promise<OrderRecord> {
    const order = this.orders.get(input.orderUuid);

    if (!order || order.userUuid !== input.userUuid) {
      throw new OrderError("Ordem nao encontrada.", 404);
    }

    if (!["open", "partially_filled"].includes(order.status)) {
      throw new OrderError("A ordem nao pode ser cancelada neste estado.", 400);
    }

    order.status = "cancelled";
    order.canceledAt = new Date();
    this.orders.set(order.uuid, order);

    return cloneOrder(order);
  }

  async listMarkets(): Promise<PublicMarketRecord[]> {
    return [cloneMarket()];
  }

  async getMarket(marketUuid: string): Promise<PublicMarketRecord> {
    if (marketUuid !== marketFixture.uuid) {
      throw new MarketCatalogError("Mercado nao encontrado.", 404);
    }

    return cloneMarket();
  }

  async getOrderBook(marketUuid: string): Promise<MarketOrderBookRecord> {
    if (marketUuid !== marketFixture.uuid) {
      throw new MarketCatalogError("Mercado nao encontrado.", 404);
    }

    const grouped = new Map<string, MarketOrderBookRecord["levels"][number]>();

    for (const order of this.orders.values()) {
      if (!["open", "partially_filled"].includes(order.status)) {
        continue;
      }

      const key = [order.side, order.outcome, order.price].join(":");
      const current = grouped.get(key);

      grouped.set(key, {
        side: order.side,
        outcome: order.outcome,
        price: order.price,
        quantity: (current?.quantity ?? 0) + order.remainingQuantity,
        orderCount: (current?.orderCount ?? 0) + 1,
      });
    }

    return {
      marketUuid,
      marketStatus: marketFixture.status,
      levels: Array.from(grouped.values()).sort((left, right) => right.price - left.price),
    };
  }

  async getTrades(marketUuid: string, input: { limit?: number } = {}): Promise<MarketTradeRecord[]> {
    if (marketUuid !== marketFixture.uuid) {
      throw new MarketCatalogError("Mercado nao encontrado.", 404);
    }

    return this.trades.slice(0, input.limit ?? 20).map(cloneTrade);
  }
}

describe("orders sprint 4 e2e", () => {
  const authService: AuthServiceContract = {
    register: async () => {
      throw new Error("not implemented");
    },
    login: async () => {
      throw new Error("not implemented");
    },
    refresh: async () => {
      throw new Error("not implemented");
    },
    getCurrentUser: async (userUuid: string) => ({
      uuid: userUuid,
      email: `${userUuid}@example.com`,
      role: "user",
      status: "active",
      createdAt: new Date("2026-03-31T09:00:00.000Z"),
      updatedAt: new Date("2026-03-31T09:00:00.000Z"),
    }),
  };

  let tradingService: InMemoryTradingService;

  beforeEach(() => {
    tradingService = new InMemoryTradingService();
  });

  it("creates orders, matches trades, updates the book and allows cancellation through HTTP routes", async () => {
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      orderService: tradingService,
      marketCatalogService: tradingService,
    });

    const buyerToken = signAccessToken({
      sub: "buyer-user-uuid",
      email: "buyer@example.com",
    });
    const sellerToken = signAccessToken({
      sub: "seller-user-uuid",
      email: "seller@example.com",
    });

    const createBuyResponse = await server.inject({
      method: "POST",
      url: "/orders",
      headers: {
        authorization: `Bearer ${buyerToken}`,
      },
      payload: {
        marketUuid: marketFixture.uuid,
        side: "buy",
        outcome: "YES",
        price: 55,
        quantity: 10,
      },
    });

    expect(createBuyResponse.statusCode).toBe(201);
    const buyOrderUuid = createBuyResponse.json().order.uuid as string;

    const buyerOrdersResponse = await server.inject({
      method: "GET",
      url: `/orders?marketUuid=${marketFixture.uuid}&limit=20`,
      headers: {
        authorization: `Bearer ${buyerToken}`,
      },
    });

    expect(buyerOrdersResponse.statusCode).toBe(200);
    expect(buyerOrdersResponse.json()).toMatchObject({
      items: [
        {
          uuid: buyOrderUuid,
          status: "open",
          remainingQuantity: 10,
        },
      ],
    });

    const bookAfterBuyResponse = await server.inject({
      method: "GET",
      url: `/markets/${marketFixture.uuid}/book`,
    });

    expect(bookAfterBuyResponse.statusCode).toBe(200);
    expect(bookAfterBuyResponse.json()).toMatchObject({
      orderBook: {
        levels: [
          {
            side: "buy",
            outcome: "YES",
            price: 55,
            quantity: 10,
            orderCount: 1,
          },
        ],
      },
    });

    const createSellResponse = await server.inject({
      method: "POST",
      url: "/orders",
      headers: {
        authorization: `Bearer ${sellerToken}`,
      },
      payload: {
        marketUuid: marketFixture.uuid,
        side: "sell",
        outcome: "YES",
        price: 55,
        quantity: 10,
      },
    });

    expect(createSellResponse.statusCode).toBe(201);
    expect(createSellResponse.json()).toMatchObject({
      order: {
        status: "filled",
        remainingQuantity: 0,
      },
    });

    const bookAfterMatchResponse = await server.inject({
      method: "GET",
      url: `/markets/${marketFixture.uuid}/book`,
    });

    expect(bookAfterMatchResponse.statusCode).toBe(200);
    expect(bookAfterMatchResponse.json()).toMatchObject({
      orderBook: {
        levels: [],
      },
    });

    const tradesResponse = await server.inject({
      method: "GET",
      url: `/markets/${marketFixture.uuid}/trades?limit=20`,
    });

    expect(tradesResponse.statusCode).toBe(200);
    expect(tradesResponse.json()).toMatchObject({
      items: [
        {
          marketUuid: marketFixture.uuid,
          price: 55,
          quantity: 10,
        },
      ],
    });

    const buyerOrdersAfterMatchResponse = await server.inject({
      method: "GET",
      url: `/orders?marketUuid=${marketFixture.uuid}&limit=20`,
      headers: {
        authorization: `Bearer ${buyerToken}`,
      },
    });

    expect(buyerOrdersAfterMatchResponse.statusCode).toBe(200);
    expect(buyerOrdersAfterMatchResponse.json()).toMatchObject({
      items: [
        {
          uuid: buyOrderUuid,
          status: "filled",
          remainingQuantity: 0,
        },
      ],
    });

    const createCancelableOrderResponse = await server.inject({
      method: "POST",
      url: "/orders",
      headers: {
        authorization: `Bearer ${buyerToken}`,
      },
      payload: {
        marketUuid: marketFixture.uuid,
        side: "sell",
        outcome: "NO",
        price: 42,
        quantity: 3,
      },
    });

    expect(createCancelableOrderResponse.statusCode).toBe(201);
    const cancelableOrderUuid = createCancelableOrderResponse.json().order.uuid as string;

    const cancelResponse = await server.inject({
      method: "POST",
      url: `/orders/${cancelableOrderUuid}/cancel`,
      headers: {
        authorization: `Bearer ${buyerToken}`,
      },
    });

    expect(cancelResponse.statusCode).toBe(200);
    expect(cancelResponse.json()).toMatchObject({
      order: {
        uuid: cancelableOrderUuid,
        status: "cancelled",
      },
    });

    const cancelledOrdersResponse = await server.inject({
      method: "GET",
      url: `/orders?marketUuid=${marketFixture.uuid}&status=cancelled&limit=20`,
      headers: {
        authorization: `Bearer ${buyerToken}`,
      },
    });

    expect(cancelledOrdersResponse.statusCode).toBe(200);
    expect(cancelledOrdersResponse.json()).toMatchObject({
      items: [
        {
          uuid: cancelableOrderUuid,
          status: "cancelled",
        },
      ],
    });
  });
});
