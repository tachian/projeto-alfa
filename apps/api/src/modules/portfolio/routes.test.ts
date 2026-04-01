import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import type { PortfolioServiceContract } from "./service.js";

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

describe("portfolio routes", () => {
  const authService: AuthServiceContract = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  const portfolioService: PortfolioServiceContract = {
    listPositions: vi.fn(),
    getPnlSummary: vi.fn(),
    listSettlements: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      uuid: "user-uuid",
      email: "user@example.com",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("lists portfolio positions for the authenticated user", async () => {
    vi.mocked(portfolioService.listPositions).mockResolvedValue([
      {
        uuid: "position-uuid",
        userUuid: "user-uuid",
        marketUuid: "market-uuid",
        outcome: "YES",
        netQuantity: 10,
        averageEntryPrice: "55.0000",
        markPrice: "60.0000",
        realizedPnl: "1.2500",
        unrealizedPnl: "0.5000",
        totalPnl: "1.7500",
        updatedAt: new Date("2026-03-31T12:00:00.000Z"),
        market: {
          uuid: "market-uuid",
          slug: "market-slug",
          title: "Market title",
          status: "open",
          closeAt: new Date("2026-06-18T21:00:00.000Z"),
        },
      },
    ]);
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      portfolioService,
    });
    const token = signAccessToken({
      sub: "user-uuid",
      email: "user@example.com",
    });

    const response = await server.inject({
      method: "GET",
      url: "/portfolio/positions?limit=20",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(portfolioService.listPositions)).toHaveBeenCalledWith({
      userUuid: "user-uuid",
      limit: 20,
    });
    expect(response.json()).toMatchObject({
      items: [
        {
          uuid: "position-uuid",
          totalPnl: "1.7500",
        },
      ],
    });

    await server.close();
  });

  it("returns portfolio pnl summary", async () => {
    vi.mocked(portfolioService.getPnlSummary).mockResolvedValue({
      realizedPnl: "0.5000",
      unrealizedPnl: "0.7500",
      totalPnl: "1.2500",
      openPositions: 2,
    });
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      portfolioService,
    });
    const token = signAccessToken({
      sub: "user-uuid",
      email: "user@example.com",
    });

    const response = await server.inject({
      method: "GET",
      url: "/portfolio/pnl",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      summary: {
        realizedPnl: "0.5000",
        unrealizedPnl: "0.7500",
        totalPnl: "1.2500",
        openPositions: 2,
      },
    });

    await server.close();
  });

  it("lists settlement history for the authenticated portfolio", async () => {
    vi.mocked(portfolioService.listSettlements).mockResolvedValue([
      {
        uuid: "position-settlement-uuid",
        settlementRunUuid: "run-uuid",
        marketUuid: "market-uuid",
        outcome: "YES",
        winningOutcome: "YES",
        positionDirection: "long",
        contractsSettled: 3,
        payoutAmount: "3.0000",
        realizedPnlDelta: "1.2000",
        status: "won",
        createdAt: new Date("2026-06-18T21:15:00.000Z"),
        market: {
          uuid: "market-uuid",
          slug: "market-slug",
          title: "Market title",
          status: "resolved",
          closeAt: new Date("2026-06-18T21:00:00.000Z"),
        },
      },
    ]);
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      portfolioService,
    });
    const token = signAccessToken({
      sub: "user-uuid",
      email: "user@example.com",
    });

    const response = await server.inject({
      method: "GET",
      url: "/portfolio/settlements?limit=20",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(portfolioService.listSettlements)).toHaveBeenCalledWith({
      userUuid: "user-uuid",
      limit: 20,
    });
    expect(response.json()).toMatchObject({
      items: [
        {
          uuid: "position-settlement-uuid",
          payoutAmount: "3.0000",
          status: "won",
        },
      ],
    });

    await server.close();
  });
});
