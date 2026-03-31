import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { describe, expect, it } from "vitest";
import { appConfig } from "./config.js";
import { buildServer } from "./server.js";

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
});

describe("buildServer", () => {
  it("returns the root document", async () => {
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
    });

    const response = await server.inject({
      method: "GET",
      url: "/",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      service: appConfig.APP_NAME,
      status: "ok",
      docs: {
        liveness: "/health/live",
        readiness: "/health/ready",
        realtime: "/realtime",
      },
    });

    await server.close();
  });

  it("reports dependencies as ready", async () => {
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
    });

    const response = await server.inject({
      method: "GET",
      url: "/health/ready",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      service: appConfig.APP_NAME,
      checks: {
        redis: "up",
        rabbitmq: "up",
      },
    });

    await server.close();
  });
});
