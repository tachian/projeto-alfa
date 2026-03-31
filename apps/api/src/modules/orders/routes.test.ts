import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import type { OrderServiceContract } from "./service.js";

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

const orderRecord = {
  uuid: "c4baf11d-3367-4b8e-bfb3-8a3a7a6d3df1",
  userUuid: "user-uuid",
  marketUuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
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
    uuid: "8fbc76f5-3958-4cb5-a7ef-c4bd67b29520",
    slug: "fed-cuts-rates",
    title: "Fed cuts rates in June",
    status: "open",
    closeAt: new Date("2026-06-18T21:00:00.000Z"),
  },
};

describe("order routes", () => {
  const authService: AuthServiceContract = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  const orderService: OrderServiceContract = {
    createOrder: vi.fn(),
    listOrders: vi.fn(),
    cancelOrder: vi.fn(),
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

  it("creates an order", async () => {
    vi.mocked(orderService.createOrder).mockResolvedValue(orderRecord);
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      orderService,
    });
    const token = signAccessToken({
      sub: "user-uuid",
      email: "user@example.com",
    });

    const response = await server.inject({
      method: "POST",
      url: "/orders",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        marketUuid: orderRecord.marketUuid,
        side: "buy",
        outcome: "YES",
        price: 55,
        quantity: 10,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      order: {
        uuid: orderRecord.uuid,
        status: "open",
      },
    });
  });

  it("lists orders for the authenticated user", async () => {
    vi.mocked(orderService.listOrders).mockResolvedValue({
      items: [orderRecord],
      meta: {
        count: 1,
        limit: 50,
      },
    });
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      orderService,
    });
    const token = signAccessToken({
      sub: "user-uuid",
      email: "user@example.com",
    });

    const response = await server.inject({
      method: "GET",
      url: `/orders?marketUuid=${orderRecord.marketUuid}&status=open&limit=20`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(orderService.listOrders)).toHaveBeenCalledWith({
      userUuid: "user-uuid",
      marketUuid: orderRecord.marketUuid,
      status: "open",
      limit: 20,
    });
    expect(response.json()).toMatchObject({
      items: [
        {
          uuid: orderRecord.uuid,
        },
      ],
    });
  });

  it("cancels an order", async () => {
    vi.mocked(orderService.cancelOrder).mockResolvedValue({
      ...orderRecord,
      status: "cancelled",
      canceledAt: new Date("2026-03-30T11:00:00.000Z"),
    });
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      orderService,
    });
    const token = signAccessToken({
      sub: "user-uuid",
      email: "user@example.com",
    });

    const response = await server.inject({
      method: "POST",
      url: `/orders/${orderRecord.uuid}/cancel`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      order: {
        uuid: orderRecord.uuid,
        status: "cancelled",
      },
    });
  });
});
