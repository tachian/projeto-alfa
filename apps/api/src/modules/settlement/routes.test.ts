import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import type { SettlementServiceContract } from "./service.js";

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

describe("settlement routes", () => {
  const authService: AuthServiceContract = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  const settlementService: SettlementServiceContract = {
    createMarketResolution: vi.fn(),
    listMarketResolutions: vi.fn(),
    createSettlementRun: vi.fn(),
    updateSettlementRun: vi.fn(),
    listSettlementRuns: vi.fn(),
    executeSettlementRun: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      uuid: "admin-user-uuid",
      email: "admin@example.com",
      role: "admin",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("creates and lists manual market resolutions", async () => {
    vi.mocked(settlementService.createMarketResolution).mockResolvedValue({
      uuid: "resolution-uuid",
      marketUuid: "market-uuid",
      winningOutcome: "YES",
      sourceValue: "Official source value",
      status: "resolved",
      notes: "Manual confirmation",
      resolvedByUserUuid: "admin-user-uuid",
      resolvedAt: new Date("2026-06-18T21:05:00.000Z"),
      createdAt: new Date("2026-06-18T21:05:00.000Z"),
      updatedAt: new Date("2026-06-18T21:05:00.000Z"),
    });
    vi.mocked(settlementService.listMarketResolutions).mockResolvedValue([
      {
        uuid: "resolution-uuid",
        marketUuid: "market-uuid",
        winningOutcome: "YES",
        sourceValue: "Official source value",
        status: "resolved",
        notes: "Manual confirmation",
        resolvedByUserUuid: "admin-user-uuid",
        resolvedAt: new Date("2026-06-18T21:05:00.000Z"),
        createdAt: new Date("2026-06-18T21:05:00.000Z"),
        updatedAt: new Date("2026-06-18T21:05:00.000Z"),
      },
    ]);

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      settlementService,
    });
    const token = signAccessToken({
      sub: "admin-user-uuid",
      email: "admin@example.com",
    });

    const createResponse = await server.inject({
      method: "POST",
      url: "/admin/markets/11111111-1111-4111-8111-111111111111/resolutions",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        winningOutcome: "YES",
        sourceValue: "Official source value",
        status: "resolved",
        notes: "Manual confirmation",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(vi.mocked(settlementService.createMarketResolution)).toHaveBeenCalledWith({
      marketUuid: "11111111-1111-4111-8111-111111111111",
      winningOutcome: "YES",
      sourceValue: "Official source value",
      status: "resolved",
      notes: "Manual confirmation",
      resolvedAt: undefined,
      resolvedByUserUuid: "admin-user-uuid",
    });

    const listResponse = await server.inject({
      method: "GET",
      url: "/admin/markets/11111111-1111-4111-8111-111111111111/resolutions",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toMatchObject({
      items: [
        {
          uuid: "resolution-uuid",
          status: "resolved",
        },
      ],
    });

    await server.close();
  });

  it("creates, lists and updates settlement runs", async () => {
    vi.mocked(settlementService.createSettlementRun).mockResolvedValue({
      uuid: "run-uuid",
      marketUuid: "market-uuid",
      marketResolutionUuid: "resolution-uuid",
      status: "pending",
      contractsProcessed: 0,
      totalPayout: "0.0000",
      metadata: null,
      startedAt: new Date("2026-06-18T21:10:00.000Z"),
      finishedAt: null,
      createdAt: new Date("2026-06-18T21:10:00.000Z"),
      updatedAt: new Date("2026-06-18T21:10:00.000Z"),
    });
    vi.mocked(settlementService.listSettlementRuns).mockResolvedValue([
      {
        uuid: "run-uuid",
        marketUuid: "market-uuid",
        marketResolutionUuid: "resolution-uuid",
        status: "pending",
        contractsProcessed: 0,
        totalPayout: "0.0000",
        metadata: null,
        startedAt: new Date("2026-06-18T21:10:00.000Z"),
        finishedAt: null,
        createdAt: new Date("2026-06-18T21:10:00.000Z"),
        updatedAt: new Date("2026-06-18T21:10:00.000Z"),
      },
    ]);
    vi.mocked(settlementService.updateSettlementRun).mockResolvedValue({
      uuid: "run-uuid",
      marketUuid: "market-uuid",
      marketResolutionUuid: "resolution-uuid",
      status: "completed",
      contractsProcessed: 12,
      totalPayout: "8.5000",
      metadata: {
        reviewed: true,
      },
      startedAt: new Date("2026-06-18T21:10:00.000Z"),
      finishedAt: new Date("2026-06-18T21:15:00.000Z"),
      createdAt: new Date("2026-06-18T21:10:00.000Z"),
      updatedAt: new Date("2026-06-18T21:15:00.000Z"),
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      settlementService,
    });
    const token = signAccessToken({
      sub: "admin-user-uuid",
      email: "admin@example.com",
    });

    const createResponse = await server.inject({
      method: "POST",
      url: "/admin/markets/11111111-1111-4111-8111-111111111111/settlement-runs",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        marketResolutionUuid: "22222222-2222-4222-8222-222222222222",
        status: "pending",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(vi.mocked(settlementService.createSettlementRun)).toHaveBeenCalledWith({
      createdByUserUuid: "admin-user-uuid",
      marketUuid: "11111111-1111-4111-8111-111111111111",
      marketResolutionUuid: "22222222-2222-4222-8222-222222222222",
      status: "pending",
      contractsProcessed: undefined,
      totalPayout: undefined,
      metadata: undefined,
      startedAt: undefined,
      finishedAt: undefined,
    });
    expect(createResponse.json()).toMatchObject({
      settlementRun: {
        uuid: "run-uuid",
      },
    });

    const listResponse = await server.inject({
      method: "GET",
      url: "/admin/markets/11111111-1111-4111-8111-111111111111/settlement-runs",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toMatchObject({
      items: [
        {
          uuid: "run-uuid",
          status: "pending",
        },
      ],
    });

    const updateResponse = await server.inject({
      method: "PATCH",
      url: "/admin/settlement-runs/33333333-3333-4333-8333-333333333333",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        status: "completed",
        contractsProcessed: 12,
        totalPayout: "8.5",
        metadata: {
          reviewed: true,
        },
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(vi.mocked(settlementService.updateSettlementRun)).toHaveBeenCalledWith({
      settlementRunUuid: "33333333-3333-4333-8333-333333333333",
      updatedByUserUuid: "admin-user-uuid",
      status: "completed",
      contractsProcessed: 12,
      totalPayout: "8.5",
      metadata: {
        reviewed: true,
      },
      finishedAt: undefined,
    });
    expect(updateResponse.json()).toMatchObject({
      settlementRun: {
        uuid: "run-uuid",
        status: "completed",
      },
    });

    await server.close();
  });

  it("executes a settlement run", async () => {
    vi.mocked(settlementService.executeSettlementRun).mockResolvedValue({
      uuid: "run-uuid",
      marketUuid: "market-uuid",
      marketResolutionUuid: "resolution-uuid",
      status: "completed",
      contractsProcessed: 12,
      totalPayout: "8.5000",
      metadata: {
        executedByUserUuid: "admin-user-uuid",
      },
      startedAt: new Date("2026-06-18T21:10:00.000Z"),
      finishedAt: new Date("2026-06-18T21:15:00.000Z"),
      createdAt: new Date("2026-06-18T21:10:00.000Z"),
      updatedAt: new Date("2026-06-18T21:15:00.000Z"),
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      settlementService,
    });
    const token = signAccessToken({
      sub: "admin-user-uuid",
      email: "admin@example.com",
    });

    const response = await server.inject({
      method: "POST",
      url: "/admin/settlement-runs/33333333-3333-4333-8333-333333333333/execute",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(settlementService.executeSettlementRun)).toHaveBeenCalledWith({
      settlementRunUuid: "33333333-3333-4333-8333-333333333333",
      executedByUserUuid: "admin-user-uuid",
    });
    expect(response.json()).toMatchObject({
      settlementRun: {
        uuid: "run-uuid",
        status: "completed",
      },
    });

    await server.close();
  });
});
