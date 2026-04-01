import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import type { AuditServiceContract } from "./service.js";

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

describe("audit routes", () => {
  const authService: AuthServiceContract = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  const auditService: AuditServiceContract = {
    listAuditLogs: vi.fn(),
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

  it("lists audit logs for the authenticated admin", async () => {
    vi.mocked(auditService.listAuditLogs).mockResolvedValue({
      items: [
        {
          uuid: "audit-uuid",
          requestUuid: "11111111-1111-4111-8111-111111111111",
          actorType: "user",
          actorUuid: "admin-user-uuid",
          action: "markets.admin.created",
          targetType: "market",
          targetUuid: "22222222-2222-4222-8222-222222222222",
          ipAddress: "127.0.0.1",
          userAgent: "vitest",
          payload: { status: "draft" },
          createdAt: new Date("2026-04-01T18:00:00.000Z"),
        },
      ],
      meta: {
        count: 1,
        limit: 10,
      },
    });
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      auditService,
    });
    const token = signAccessToken({
      sub: "admin-user-uuid",
      email: "admin@example.com",
    });

    const response = await server.inject({
      method: "GET",
      url: "/admin/audit-logs?targetType=market&limit=10",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(auditService.listAuditLogs)).toHaveBeenCalledWith({
      actorUuid: undefined,
      action: undefined,
      targetType: "market",
      targetUuid: undefined,
      requestUuid: undefined,
      limit: 10,
    });
    expect(response.json()).toMatchObject({
      items: [
        {
          uuid: "audit-uuid",
          action: "markets.admin.created",
        },
      ],
      meta: {
        count: 1,
      },
    });
  });
});
