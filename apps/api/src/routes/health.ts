import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health/live", async () => {
    return {
      ok: true,
      service: fastify.appConfig.APP_NAME,
      uptime: process.uptime(),
    };
  });

  fastify.get("/health/ready", async (_, reply) => {
    const checks: Record<"redis" | "rabbitmq", "up" | "down"> = {
      redis: "down",
      rabbitmq: "down",
    };

    try {
      const pong = await fastify.redis.ping();
      checks.redis = pong === "PONG" ? "up" : "down";
    } catch {
      checks.redis = "down";
    }

    try {
      const channel = await fastify.amqp.createChannel();
      await channel.close();
      checks.rabbitmq = "up";
    } catch {
      checks.rabbitmq = "down";
    }

    const ok = checks.redis === "up" && checks.rabbitmq === "up";

    if (!ok) {
      reply.code(503);
    }

    return {
      ok,
      service: fastify.appConfig.APP_NAME,
      environment: fastify.appConfig.NODE_ENV,
      checks,
    };
  });
};
