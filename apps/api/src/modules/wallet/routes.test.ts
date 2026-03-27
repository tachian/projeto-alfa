import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import type { WalletServiceContract } from "./service.js";

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

describe("wallet routes", () => {
  const authService: AuthServiceContract = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  const walletService: WalletServiceContract = {
    getBalance: vi.fn(),
    getStatement: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authenticated wallet balance", async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      uuid: "a6e8f0bb-b5b4-43c7-a953-1ca33889f001",
      email: "wallet@example.com",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(walletService.getBalance).mockResolvedValue({
      currency: "USD",
      available: "100.0000",
      reserved: "20.0000",
      total: "120.0000",
      accounts: {
        available: {
          uuid: "available-uuid",
          balance: "100.0000",
        },
        reserved: {
          uuid: "reserved-uuid",
          balance: "20.0000",
        },
      },
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      walletService,
    });

    const token = signAccessToken({
      sub: "a6e8f0bb-b5b4-43c7-a953-1ca33889f001",
      email: "wallet@example.com",
    });

    const response = await server.inject({
      method: "GET",
      url: "/wallet/balance",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      balance: {
        currency: "USD",
        available: "100.0000",
        reserved: "20.0000",
        total: "120.0000",
        accounts: {
          available: {
            uuid: "available-uuid",
            balance: "100.0000",
          },
          reserved: {
            uuid: "reserved-uuid",
            balance: "20.0000",
          },
        },
      },
    });
  });

  it("returns the authenticated wallet statement", async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      uuid: "user-uuid",
      email: "wallet@example.com",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(walletService.getStatement).mockResolvedValue({
      entries: [
        {
          uuid: "entry-1",
          transactionUuid: "tx-1",
          accountUuid: "available-uuid",
          accountType: "available",
          entryType: "deposit_completed",
          amount: "100.0000",
          direction: "credit",
          referenceType: "payment",
          referenceUuid: null,
          description: "Initial deposit",
          createdAt: new Date("2026-03-27T10:00:00.000Z"),
          metadata: { provider: "manual" },
        },
      ],
      meta: {
        count: 1,
        limit: 10,
        currency: "USD",
      },
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      walletService,
    });

    const token = signAccessToken({
      sub: "user-uuid",
      email: "wallet@example.com",
    });

    const response = await server.inject({
      method: "GET",
      url: "/wallet/entries?limit=10",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      entries: [
        {
          uuid: "entry-1",
          transactionUuid: "tx-1",
          accountUuid: "available-uuid",
          accountType: "available",
          entryType: "deposit_completed",
          amount: "100.0000",
          direction: "credit",
          referenceType: "payment",
          referenceUuid: null,
          description: "Initial deposit",
          createdAt: "2026-03-27T10:00:00.000Z",
          metadata: { provider: "manual" },
        },
      ],
      meta: {
        count: 1,
        limit: 10,
        currency: "USD",
      },
    });
  });
});
