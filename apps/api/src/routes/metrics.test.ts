import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { afterEach, describe, expect, it } from "vitest";
import { appConfig } from "../config.js";
import { resetMetrics } from "../lib/metrics.js";
import { buildServer } from "../server.js";

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

describe("metrics routes", () => {
  afterEach(() => {
    resetMetrics();
  });

  it("exposes Prometheus metrics", async () => {
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
    });

    await server.inject({
      method: "GET",
      url: "/",
    });

    const response = await server.inject({
      method: "GET",
      url: "/metrics",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.body).toContain("projeto_alfa_http_requests_total");
  });
});
