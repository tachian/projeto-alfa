import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import type { ReconciliationServiceContract } from "./service.js";

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

describe("reconciliation routes", () => {
  const authService: AuthServiceContract = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  const reconciliationService: ReconciliationServiceContract = {
    generateReport: vi.fn(),
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

  it("returns the reconciliation report for an authenticated admin", async () => {
    vi.mocked(reconciliationService.generateReport).mockResolvedValue({
      generatedAt: new Date("2026-04-01T18:00:00.000Z"),
      summary: {
        status: "warning",
        totalChecks: 4,
        warnings: 1,
        criticals: 0,
      },
      checks: [
        {
          check: "overdue_market_resolution",
          status: "warning",
          summary: "Existem mercados vencidos.",
          driftAmount: "2.0000",
        },
      ],
    });
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      reconciliationService,
    });
    const token = signAccessToken({
      sub: "admin-user-uuid",
      email: "admin@example.com",
    });

    const response = await server.inject({
      method: "GET",
      url: "/admin/reconciliation/report",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(reconciliationService.generateReport)).toHaveBeenCalled();
    expect(response.json()).toMatchObject({
      summary: {
        status: "warning",
      },
      checks: [
        {
          check: "overdue_market_resolution",
        },
      ],
    });
  });
});
