import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import { PaymentError } from "./errors.js";
import type { PaymentServiceContract } from "./service.js";

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

describe("payment routes", () => {
  const authService: AuthServiceContract = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  const paymentService: PaymentServiceContract = {
    createDeposit: vi.fn(),
    createWithdrawal: vi.fn(),
    listPayments: vi.fn(),
    listMethods: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a mock deposit for the authenticated user", async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      uuid: "user-uuid",
      email: "wallet@example.com",
      role: "user",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(paymentService.createDeposit).mockResolvedValue({
      uuid: "payment-uuid",
      type: "deposit",
      status: "completed",
      provider: "manual",
      idempotencyKey: "dep-001",
      amount: "100.0000",
      currency: "USD",
      description: "Top-up",
      ledgerTransactionUuid: "ledger-tx-uuid",
      createdAt: new Date("2026-03-27T15:00:00.000Z"),
      updatedAt: new Date("2026-03-27T15:01:00.000Z"),
      processedAt: new Date("2026-03-27T15:01:00.000Z"),
      metadata: null,
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      paymentService,
    });

    const token = signAccessToken({
      sub: "user-uuid",
      email: "wallet@example.com",
    });

    const response = await server.inject({
      method: "POST",
      url: "/payments/deposits",
      headers: {
        authorization: `Bearer ${token}`,
        "idempotency-key": "dep-001",
      },
      payload: {
        amount: 100,
        description: "Top-up",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(vi.mocked(paymentService.createDeposit)).toHaveBeenCalledWith({
      userUuid: "user-uuid",
      amount: 100,
      description: "Top-up",
      currency: undefined,
      method: undefined,
      idempotencyKey: "dep-001",
    });
    expect(response.json()).toEqual({
      payment: {
        uuid: "payment-uuid",
        type: "deposit",
        status: "completed",
        provider: "manual",
        idempotencyKey: "dep-001",
        amount: "100.0000",
        currency: "USD",
        description: "Top-up",
        ledgerTransactionUuid: "ledger-tx-uuid",
        createdAt: "2026-03-27T15:00:00.000Z",
        updatedAt: "2026-03-27T15:01:00.000Z",
        processedAt: "2026-03-27T15:01:00.000Z",
        metadata: null,
      },
    });
  });

  it("returns validation from the withdrawal flow", async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      uuid: "user-uuid",
      email: "wallet@example.com",
      role: "user",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(paymentService.createWithdrawal).mockRejectedValue(
      new PaymentError("Saldo insuficiente para saque.", 400),
    );

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      paymentService,
    });

    const token = signAccessToken({
      sub: "user-uuid",
      email: "wallet@example.com",
    });

    const response = await server.inject({
      method: "POST",
      url: "/payments/withdrawals",
      headers: {
        authorization: `Bearer ${token}`,
        "idempotency-key": "wd-001",
      },
      payload: {
        amount: 999,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "Saldo insuficiente para saque.",
    });
  });

  it("returns payment methods capabilities without requiring authentication", async () => {
    vi.mocked(paymentService.listMethods).mockResolvedValue({
      items: [
        {
          key: "manual_mock",
          type: "deposit",
          provider: "manual",
          availability: "enabled",
          executionModel: "instant_completion",
          supportedCurrencies: ["USD"],
          idempotencySupported: true,
          asyncSettlement: false,
          description: "Metodo local de desenvolvimento que liquida o deposito imediatamente no ledger.",
        },
        {
          key: "pix",
          type: "deposit",
          provider: "pix_mock",
          availability: "planned",
          executionModel: "async_confirmation",
          supportedCurrencies: ["USD"],
          idempotencySupported: true,
          asyncSettlement: true,
          description: "Fluxo preparado para PIX com confirmacao assincrona por webhook ou conciliacao.",
        },
      ],
      meta: {
        count: 2,
        type: "deposit",
      },
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      paymentService,
    });

    const response = await server.inject({
      method: "GET",
      url: "/payments/methods?type=deposit",
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(paymentService.listMethods)).toHaveBeenCalledWith({
      type: "deposit",
    });
    expect(response.json()).toEqual({
      items: [
        {
          key: "manual_mock",
          type: "deposit",
          provider: "manual",
          availability: "enabled",
          executionModel: "instant_completion",
          supportedCurrencies: ["USD"],
          idempotencySupported: true,
          asyncSettlement: false,
          description: "Metodo local de desenvolvimento que liquida o deposito imediatamente no ledger.",
        },
        {
          key: "pix",
          type: "deposit",
          provider: "pix_mock",
          availability: "planned",
          executionModel: "async_confirmation",
          supportedCurrencies: ["USD"],
          idempotencySupported: true,
          asyncSettlement: true,
          description: "Fluxo preparado para PIX com confirmacao assincrona por webhook ou conciliacao.",
        },
      ],
      meta: {
        count: 2,
        type: "deposit",
      },
    });
  });

  it("lists deposit history for the authenticated user", async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      uuid: "user-uuid",
      email: "wallet@example.com",
      role: "user",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(paymentService.listPayments).mockResolvedValue({
      items: [
        {
          uuid: "payment-uuid",
          type: "deposit",
          status: "completed",
          provider: "manual",
          idempotencyKey: "dep-002",
          amount: "25.0000",
          currency: "USD",
          description: null,
          ledgerTransactionUuid: "ledger-tx-uuid",
          createdAt: new Date("2026-03-27T15:00:00.000Z"),
          updatedAt: new Date("2026-03-27T15:01:00.000Z"),
          processedAt: new Date("2026-03-27T15:01:00.000Z"),
          metadata: { source: "manual" },
        },
      ],
      meta: {
        count: 1,
        limit: 20,
        type: "deposit",
        currency: "USD",
      },
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      paymentService,
    });

    const token = signAccessToken({
      sub: "user-uuid",
      email: "wallet@example.com",
    });

    const response = await server.inject({
      method: "GET",
      url: "/payments/deposits?limit=20",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: [
        {
          uuid: "payment-uuid",
          type: "deposit",
          status: "completed",
          provider: "manual",
          idempotencyKey: "dep-002",
          amount: "25.0000",
          currency: "USD",
          description: null,
          ledgerTransactionUuid: "ledger-tx-uuid",
          createdAt: "2026-03-27T15:00:00.000Z",
          updatedAt: "2026-03-27T15:01:00.000Z",
          processedAt: "2026-03-27T15:01:00.000Z",
          metadata: {
            source: "manual",
          },
        },
      ],
      meta: {
        count: 1,
        limit: 20,
        type: "deposit",
        currency: "USD",
      },
    });
  });
});
