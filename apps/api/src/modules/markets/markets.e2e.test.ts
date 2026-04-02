import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import type { MarketCatalogServiceContract } from "./public-service.js";
import type {
  CreateMarketInput,
  MarketAdminRecord,
  MarketAdminServiceContract,
  UpdateMarketInput,
} from "./service.js";

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

const cloneMarketRecord = (market: MarketAdminRecord): MarketAdminRecord => ({
  ...market,
  openAt: market.openAt ? new Date(market.openAt) : null,
  closeAt: new Date(market.closeAt),
  createdAt: new Date(market.createdAt),
  updatedAt: new Date(market.updatedAt),
  rules: {
    ...market.rules,
    createdAt: new Date(market.rules.createdAt),
    updatedAt: new Date(market.rules.updatedAt),
  },
});

class InMemoryMarketService implements MarketAdminServiceContract, MarketCatalogServiceContract {
  private readonly markets = new Map<string, MarketAdminRecord>();

  async createMarket(input: CreateMarketInput): Promise<MarketAdminRecord> {
    const uuid = crypto.randomUUID();
    const now = new Date("2026-03-30T15:00:00.000Z");
    const market: MarketAdminRecord = {
      uuid,
      slug: input.slug,
      title: input.title,
      category: input.category,
      status: input.status,
      outcomeType: input.outcomeType ?? "binary",
      contractValue: Number(input.contractValue ?? 1).toFixed(2),
      tickSize: input.tickSize ?? 1,
      openAt: input.openAt ?? null,
      closeAt: input.closeAt,
      createdAt: now,
      updatedAt: now,
      rules: {
        officialSourceLabel: input.officialSourceLabel,
        officialSourceUrl: input.officialSourceUrl,
        resolutionRules: input.resolutionRules,
        createdAt: now,
        updatedAt: now,
      },
    };

    this.markets.set(uuid, cloneMarketRecord(market));
    return cloneMarketRecord(market);
  }

  private listMarketsForAdmin(): MarketAdminRecord[] {
    return Array.from(this.markets.values())
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map(cloneMarketRecord);
  }

  async getMarket(marketUuid: string): Promise<MarketAdminRecord> {
    const market = this.markets.get(marketUuid);

    if (!market) {
      throw new Error("Mercado nao encontrado.");
    }

    return cloneMarketRecord(market);
  }

  async updateMarket(input: UpdateMarketInput): Promise<MarketAdminRecord> {
    const existing = this.markets.get(input.marketUuid);

    if (!existing) {
      throw new Error("Mercado nao encontrado.");
    }

    const updated: MarketAdminRecord = {
      ...existing,
      slug: input.slug ?? existing.slug,
      title: input.title ?? existing.title,
      category: input.category ?? existing.category,
      status: input.status ?? existing.status,
      outcomeType: input.outcomeType ?? existing.outcomeType,
      contractValue:
        input.contractValue === undefined ? existing.contractValue : Number(input.contractValue).toFixed(2),
      tickSize: input.tickSize ?? existing.tickSize,
      openAt: input.openAt === undefined ? existing.openAt : input.openAt,
      closeAt: input.closeAt ?? existing.closeAt,
      updatedAt: new Date("2026-03-30T16:00:00.000Z"),
      rules: {
        officialSourceLabel: input.officialSourceLabel ?? existing.rules.officialSourceLabel,
        officialSourceUrl: input.officialSourceUrl ?? existing.rules.officialSourceUrl,
        resolutionRules: input.resolutionRules ?? existing.rules.resolutionRules,
        createdAt: existing.rules.createdAt,
        updatedAt: new Date("2026-03-30T16:00:00.000Z"),
      },
    };

    this.markets.set(existing.uuid, cloneMarketRecord(updated));
    return cloneMarketRecord(updated);
  }

  async deleteMarket(marketUuid: string): Promise<void> {
    this.markets.delete(marketUuid);
  }

  private listMarketsForCatalog(input?: {
    status?: string;
    category?: string;
    closeAtFrom?: Date;
    closeAtTo?: Date;
  }): MarketAdminRecord[] {
    return Array.from(this.markets.values())
      .filter((market) => !input?.status || market.status === input.status)
      .filter((market) => !input?.category || market.category === input.category)
      .filter((market) => !input?.closeAtFrom || market.closeAt >= input.closeAtFrom)
      .filter((market) => !input?.closeAtTo || market.closeAt <= input.closeAtTo)
      .sort((left, right) => left.closeAt.getTime() - right.closeAt.getTime())
      .map(cloneMarketRecord);
  }

  async listMarkets(input?: {
    status?: string;
    category?: string;
    closeAtFrom?: Date;
    closeAtTo?: Date;
  }): Promise<MarketAdminRecord[]>;
  async listMarkets(): Promise<MarketAdminRecord[]>;
  async listMarkets(input?: {
    status?: string;
    category?: string;
    closeAtFrom?: Date;
    closeAtTo?: Date;
  }): Promise<MarketAdminRecord[]> {
    if (input && (input.status || input.category || input.closeAtFrom || input.closeAtTo)) {
      return this.listMarketsForCatalog(input);
    }

    return this.listMarketsForAdmin();
  }

  async getOrderBook(marketUuid: string) {
    const market = this.markets.get(marketUuid);

    if (!market) {
      throw new Error("Mercado nao encontrado.");
    }

    return {
      marketUuid: market.uuid,
      marketStatus: market.status,
      levels: [],
    };
  }

  async getTrades(marketUuid: string) {
    const market = this.markets.get(marketUuid);

    if (!market) {
      throw new Error("Mercado nao encontrado.");
    }

    return [];
  }
}

describe("markets sprint 3 e2e", () => {
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
    getCurrentUser: async () => ({
      uuid: "admin-user-uuid",
      email: "admin@example.com",
      role: "admin",
      status: "active",
      createdAt: new Date("2026-03-30T09:00:00.000Z"),
      updatedAt: new Date("2026-03-30T09:00:00.000Z"),
    }),
  };

  let marketService: InMemoryMarketService;

  beforeEach(() => {
    marketService = new InMemoryMarketService();
  });

  it("creates, edits, lists and closes a market across admin and public routes", async () => {
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      marketAdminService: marketService,
      marketCatalogService: marketService,
    });

    const token = signAccessToken({
      sub: "admin-user-uuid",
      email: "admin@example.com",
    });

    const createResponse = await server.inject({
      method: "POST",
      url: "/admin/markets",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        slug: "fed-cuts-rates-june",
        title: "Fed cuts rates in June",
        category: "macro",
        status: "draft",
        outcomeType: "binary",
        contractValue: "1.00",
        tickSize: 1,
        openAt: "2026-06-01T10:00:00.000Z",
        closeAt: "2026-06-18T21:00:00.000Z",
        officialSourceLabel: "Federal Reserve statement",
        officialSourceUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
        resolutionRules: "Resolves YES if the Fed announces a rate cut.",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdMarketUuid = createResponse.json().market.uuid as string;

    const updateResponse = await server.inject({
      method: "PATCH",
      url: `/admin/markets/${createdMarketUuid}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        title: "Fed cuts rates before June meeting ends",
        status: "open",
        resolutionRules: "Resolves YES if the Fed officially announces any rate cut at the June meeting.",
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      market: {
        uuid: createdMarketUuid,
        status: "open",
        title: "Fed cuts rates before June meeting ends",
      },
    });

    const adminListResponse = await server.inject({
      method: "GET",
      url: "/admin/markets",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(adminListResponse.statusCode).toBe(200);
    expect(adminListResponse.json()).toMatchObject({
      items: [
        {
          uuid: createdMarketUuid,
          status: "open",
        },
      ],
    });

    const publicListResponse = await server.inject({
      method: "GET",
      url: "/markets?status=open&category=macro&closeAtFrom=2026-06-01T00:00:00.000Z&closeAtTo=2026-06-30T23:59:59.000Z",
    });

    expect(publicListResponse.statusCode).toBe(200);
    expect(publicListResponse.json()).toMatchObject({
      items: [
        {
          uuid: createdMarketUuid,
          status: "open",
          category: "macro",
        },
      ],
    });

    const publicDetailResponse = await server.inject({
      method: "GET",
      url: `/markets/${createdMarketUuid}`,
    });

    expect(publicDetailResponse.statusCode).toBe(200);
    expect(publicDetailResponse.json()).toMatchObject({
      market: {
        uuid: createdMarketUuid,
        rules: {
          officialSourceLabel: "Federal Reserve statement",
          resolutionRules: "Resolves YES if the Fed officially announces any rate cut at the June meeting.",
        },
      },
    });

    const closeResponse = await server.inject({
      method: "PATCH",
      url: `/admin/markets/${createdMarketUuid}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        status: "closed",
      },
    });

    expect(closeResponse.statusCode).toBe(200);
    expect(closeResponse.json()).toMatchObject({
      market: {
        uuid: createdMarketUuid,
        status: "closed",
      },
    });
  });
});
