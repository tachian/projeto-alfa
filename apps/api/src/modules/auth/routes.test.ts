import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import { signAccessToken } from "./tokens.js";
import type { AuthServiceContract } from "./service.js";

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

const makeUser = () => ({
  uuid: "11111111-1111-1111-1111-111111111111",
  name: "Usuario Exemplo",
  email: "user@example.com",
  phone: "+5585999999999",
  role: "user",
  status: "active",
  createdAt: new Date("2026-03-27T10:00:00.000Z"),
  updatedAt: new Date("2026-03-27T10:00:00.000Z"),
});

const makeTokens = () => ({
  accessToken: "access-token",
  refreshToken: "refresh-token",
  accessTokenExpiresIn: appConfig.JWT_EXPIRES_IN,
  refreshTokenExpiresIn: appConfig.JWT_REFRESH_EXPIRES_IN,
});

describe("auth routes", () => {
  const registerMock = vi.fn<AuthServiceContract["register"]>();
  const loginMock = vi.fn<AuthServiceContract["login"]>();
  const refreshMock = vi.fn<AuthServiceContract["refresh"]>();
  const getCurrentUserMock = vi.fn<AuthServiceContract["getCurrentUser"]>();

  const authService: AuthServiceContract = {
    register: registerMock,
    login: loginMock,
    refresh: refreshMock,
    getCurrentUser: getCurrentUserMock,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new account via register", async () => {
    registerMock.mockResolvedValue({
      user: makeUser(),
      tokens: makeTokens(),
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
    });

    const response = await server.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "USER@example.com",
        password: "password123",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(registerMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
    expect(response.json()).toMatchObject({
      user: {
        name: "Usuario Exemplo",
        phone: "+5585999999999",
      },
    });

    await server.close();
  });

  it("returns tokens on login", async () => {
    loginMock.mockResolvedValue({
      user: makeUser(),
      tokens: makeTokens(),
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
    });

    const response = await server.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "user@example.com",
        password: "password123",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: {
        name: "Usuario Exemplo",
        email: "user@example.com",
        phone: "+5585999999999",
      },
      tokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    });

    await server.close();
  });

  it("rotates the refresh token", async () => {
    refreshMock.mockResolvedValue({
      user: makeUser(),
      tokens: {
        ...makeTokens(),
        refreshToken: "rotated-refresh-token",
      },
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
    });

    const response = await server.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: {
        refreshToken: "refresh-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(refreshMock).toHaveBeenCalledWith("refresh-token");
    expect(response.json()).toMatchObject({
      tokens: {
        refreshToken: "rotated-refresh-token",
      },
    });

    await server.close();
  });

  it("returns the current user from the access token", async () => {
    getCurrentUserMock.mockResolvedValue(makeUser());

    const accessToken = signAccessToken({
      sub: "11111111-1111-1111-1111-111111111111",
      email: "user@example.com",
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
    });

    const response = await server.inject({
      method: "GET",
      url: "/auth/me",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(getCurrentUserMock).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
    expect(response.json()).toMatchObject({
      user: {
        uuid: "11111111-1111-1111-1111-111111111111",
        name: "Usuario Exemplo",
        phone: "+5585999999999",
      },
    });

    await server.close();
  });
});
