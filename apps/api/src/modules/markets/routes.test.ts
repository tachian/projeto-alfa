import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import type { MarketAdminServiceContract } from "./service.js";

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
  status: "draft",
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

describe("market admin routes", () => {
  const authService: AuthServiceContract = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  const marketAdminService: MarketAdminServiceContract = {
    createMarket: vi.fn(),
    listMarkets: vi.fn(),
    getMarket: vi.fn(),
    updateMarket: vi.fn(),
    deleteMarket: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      uuid: "admin-user-uuid",
      email: "admin@example.com",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("creates a market via admin route", async () => {
    vi.mocked(marketAdminService.createMarket).mockResolvedValue(marketRecord);
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      marketAdminService,
    });
    const token = signAccessToken({
      sub: "admin-user-uuid",
      email: "admin@example.com",
    });

    const response = await server.inject({
      method: "POST",
      url: "/admin/markets",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        slug: "fed-cuts-rates",
        title: "Fed cuts rates in June",
        category: "macro",
        status: "draft",
        openAt: "2026-06-01T10:00:00.000Z",
        closeAt: "2026-06-18T21:00:00.000Z",
        officialSourceLabel: "Federal Reserve statement",
        officialSourceUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
        resolutionRules: "Resolves YES if the Fed announces a rate cut.",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      market: {
        uuid: marketRecord.uuid,
        slug: marketRecord.slug,
      },
    });
  });

  it("lists markets via admin route", async () => {
    vi.mocked(marketAdminService.listMarkets).mockResolvedValue([marketRecord]);
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      marketAdminService,
    });
    const token = signAccessToken({
      sub: "admin-user-uuid",
      email: "admin@example.com",
    });

    const response = await server.inject({
      method: "GET",
      url: "/admin/markets",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      items: [
        {
          uuid: marketRecord.uuid,
        },
      ],
    });
  });

  it("updates a market via admin route", async () => {
    vi.mocked(marketAdminService.updateMarket).mockResolvedValue({
      ...marketRecord,
      status: "open",
    });
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      marketAdminService,
    });
    const token = signAccessToken({
      sub: "admin-user-uuid",
      email: "admin@example.com",
    });

    const response = await server.inject({
      method: "PATCH",
      url: `/admin/markets/${marketRecord.uuid}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        status: "open",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      market: {
        status: "open",
      },
    });
  });

  it("deletes a market via admin route", async () => {
    vi.mocked(marketAdminService.deleteMarket).mockResolvedValue(undefined);
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      marketAdminService,
    });
    const token = signAccessToken({
      sub: "admin-user-uuid",
      email: "admin@example.com",
    });

    const response = await server.inject({
      method: "DELETE",
      url: `/admin/markets/${marketRecord.uuid}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(204);
  });
});
