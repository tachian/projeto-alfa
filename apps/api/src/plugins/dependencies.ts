import fp from "fastify-plugin";
import type { ChannelModel } from "amqplib";
import amqp from "amqplib";
import { Redis } from "ioredis";
import type { FastifyPluginAsync } from "fastify";
import { appConfig } from "../config.js";

type DependencyStatus = "up" | "down";

declare module "fastify" {
  interface FastifyInstance {
    appConfig: typeof appConfig;
    redis: Redis;
    amqp: ChannelModel;
    dependencyHealth: {
      redis: DependencyStatus;
      rabbitmq: DependencyStatus;
    };
  }
}

const dependenciesPlugin: FastifyPluginAsync = async (fastify) => {
  const redis = new Redis(appConfig.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  let redisStatus: DependencyStatus = "down";
  let rabbitmqStatus: DependencyStatus = "down";

  await redis.connect();
  redisStatus = "up";

  const amqpConnection = await amqp.connect(appConfig.RABBITMQ_URL);
  const amqpChannel = await amqpConnection.createChannel();
  rabbitmqStatus = "up";

  fastify.decorate("appConfig", appConfig);
  fastify.decorate("redis", redis);
  fastify.decorate("amqp", amqpConnection);
  fastify.decorate("dependencyHealth", {
    redis: redisStatus,
    rabbitmq: rabbitmqStatus,
  });

  fastify.addHook("onClose", async () => {
    await amqpChannel.close();
    await amqpConnection.close();
    await redis.quit();
  });
};

export const dependenciesPluginRegistered = fp(dependenciesPlugin, {
  name: "dependencies",
});
