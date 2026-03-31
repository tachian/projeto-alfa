import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { MarketCatalogServiceContract } from "./public-service.js";

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

const marketRecord = {
  uuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
  slug: "fed-cuts-rates",
  title: "Fed cuts rates in June",
  category: "macro",
  status: "open",
  outcomeType: "binary",
  contractValue: "1.00",
  tickSize: 1,
  openAt: new Date("2026-06-01T10:00:00.000Z"),
  closeAt: new Date("2026-06-18T21:00:00.000Z"),
  createdAt: new Date("2026-03-27T10:00:00.000Z"),
  updatedAt: new Date("2026-03-27T10:00:00.000Z"),
  rules: {
    officialSourceLabel: "Federal Reserve statement",
    officialSourceUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
    resolutionRules: "Resolves YES if the Fed announces a rate cut.",
    createdAt: new Date("2026-03-27T10:00:00.000Z"),
    updatedAt: new Date("2026-03-27T10:00:00.000Z"),
  },
};

describe("market catalog routes", () => {
  const marketCatalogService: MarketCatalogServiceContract = {
    listMarkets: vi.fn(),
    getMarket: vi.fn(),
    getOrderBook: vi.fn(),
    getTrades: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists public markets", async () => {
    vi.mocked(marketCatalogService.listMarkets).mockResolvedValue([marketRecord]);

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      marketCatalogService,
    });

    const response = await server.inject({
      method: "GET",
      url: "/markets?status=open&category=macro&closeAtFrom=2026-06-01T00:00:00.000Z&closeAtTo=2026-06-30T23:59:59.000Z",
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(marketCatalogService.listMarkets)).toHaveBeenCalledWith({
      status: "open",
      category: "macro",
      closeAtFrom: new Date("2026-06-01T00:00:00.000Z"),
      closeAtTo: new Date("2026-06-30T23:59:59.000Z"),
    });
    expect(response.json()).toMatchObject({
      items: [
        {
          uuid: marketRecord.uuid,
          slug: marketRecord.slug,
          status: "open",
        },
      ],
    });
  });

  it("returns market detail publicly", async () => {
    vi.mocked(marketCatalogService.getMarket).mockResolvedValue(marketRecord);

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      marketCatalogService,
    });

    const response = await server.inject({
      method: "GET",
      url: `/markets/${marketRecord.uuid}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      market: {
        uuid: marketRecord.uuid,
        rules: {
          officialSourceLabel: "Federal Reserve statement",
        },
      },
    });
  });

  it("returns the market order book publicly", async () => {
    vi.mocked(marketCatalogService.getOrderBook).mockResolvedValue({
      marketUuid: marketRecord.uuid,
      marketStatus: "open",
      levels: [
        {
          side: "buy",
          outcome: "YES",
          price: 55,
          quantity: 12,
          orderCount: 2,
        },
      ],
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      marketCatalogService,
    });

    const response = await server.inject({
      method: "GET",
      url: `/markets/${marketRecord.uuid}/book`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      orderBook: {
        marketUuid: marketRecord.uuid,
        marketStatus: "open",
        levels: [
          {
            side: "buy",
            outcome: "YES",
            price: 55,
            quantity: 12,
            orderCount: 2,
          },
        ],
      },
    });
  });

  it("returns the latest market trades publicly", async () => {
    vi.mocked(marketCatalogService.getTrades).mockResolvedValue([
      {
        uuid: "trade-uuid",
        marketUuid: marketRecord.uuid,
        buyOrderUuid: "buy-order-uuid",
        sellOrderUuid: "sell-order-uuid",
        price: 58,
        quantity: 4,
        executedAt: new Date("2026-06-10T14:00:00.000Z"),
      },
    ]);

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      marketCatalogService,
    });

    const response = await server.inject({
      method: "GET",
      url: `/markets/${marketRecord.uuid}/trades?limit=10`,
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(marketCatalogService.getTrades)).toHaveBeenCalledWith(marketRecord.uuid, {
      limit: 10,
    });
    expect(response.json()).toMatchObject({
      items: [
        {
          uuid: "trade-uuid",
          marketUuid: marketRecord.uuid,
          price: 58,
          quantity: 4,
        },
      ],
    });
  });
});
