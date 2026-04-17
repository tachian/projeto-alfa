import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import type { UserServiceContract } from "./service.js";

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

const makeUser = () => ({
  uuid: "user-uuid",
  name: "Usuario Exemplo",
  email: "user@example.com",
  phone: "+5585999999999",
  role: "user",
  status: "active",
  createdAt: new Date("2026-04-09T10:00:00.000Z"),
  updatedAt: new Date("2026-04-09T10:00:00.000Z"),
});

describe("user routes", () => {
  const authService: AuthServiceContract = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  const userService: UserServiceContract = {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockResolvedValue(makeUser());
  });

  it("returns the authenticated user profile", async () => {
    vi.mocked(userService.getProfile).mockResolvedValue(makeUser());

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      userService,
    });
    const token = signAccessToken({
      sub: "user-uuid",
      email: "user@example.com",
    });

    const response = await server.inject({
      method: "GET",
      url: "/users/me",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(userService.getProfile)).toHaveBeenCalledWith("user-uuid");
    expect(response.json()).toMatchObject({
      user: {
        name: "Usuario Exemplo",
        email: "user@example.com",
        phone: "+5585999999999",
      },
    });

    await server.close();
  });

  it("updates the authenticated user profile", async () => {
    vi.mocked(userService.updateProfile).mockResolvedValue({
      ...makeUser(),
      name: "Usuario Atualizado",
      email: "novo@example.com",
      phone: "+5585888888888",
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      userService,
    });
    const token = signAccessToken({
      sub: "user-uuid",
      email: "user@example.com",
    });

    const response = await server.inject({
      method: "PATCH",
      url: "/users/me",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: "  Usuario Atualizado  ",
        email: "NOVO@example.com",
        phone: " +5585888888888 ",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(userService.updateProfile)).toHaveBeenCalledWith({
      userUuid: "user-uuid",
      name: "Usuario Atualizado",
      email: "novo@example.com",
      phone: "+5585888888888",
    });
    expect(response.json()).toMatchObject({
      user: {
        name: "Usuario Atualizado",
        email: "novo@example.com",
      },
    });

    await server.close();
  });
});
