import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthServiceContract } from "../auth/service.js";
import { signAccessToken } from "../auth/tokens.js";
import type { KycServiceContract } from "./service.js";

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

describe("kyc routes", () => {
  const authService: AuthServiceContract = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  const kycService: KycServiceContract = {
    submitVerification: vi.fn(),
    getLatestVerification: vi.fn(),
    getRequirements: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      uuid: "user-uuid",
      email: "user@example.com",
      status: "active",
      createdAt: new Date("2026-04-01T10:00:00.000Z"),
      updatedAt: new Date("2026-04-01T10:00:00.000Z"),
    });
  });

  it("creates a kyc submission", async () => {
    vi.mocked(kycService.submitVerification).mockResolvedValue({
      uuid: "verification-uuid",
      userUuid: "user-uuid",
      provider: "mock",
      providerReference: "mock-ref",
      verificationType: "individual",
      status: "approved",
      amlStatus: "clear",
      riskLevel: "low",
      fullName: "Ada Lovelace",
      documentType: "passport",
      documentNumberMasked: "****2345",
      countryCode: "BR",
      birthDate: new Date("1990-01-01T00:00:00.000Z"),
      reviewedAt: new Date("2026-04-01T10:05:00.000Z"),
      requirements: [],
      createdAt: new Date("2026-04-01T10:05:00.000Z"),
      updatedAt: new Date("2026-04-01T10:05:00.000Z"),
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      kycService,
    });

    const token = signAccessToken({
      sub: "user-uuid",
      email: "user@example.com",
    });

    const response = await server.inject({
      method: "POST",
      url: "/kyc/submissions",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        fullName: "Ada Lovelace",
        documentType: "passport",
        documentNumber: "ABC12345",
        countryCode: "BR",
        birthDate: "1990-01-01T00:00:00.000Z",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      verification: {
        uuid: "verification-uuid",
        status: "approved",
      },
    });
  });

  it("returns the latest verification and requirements", async () => {
    vi.mocked(kycService.getLatestVerification).mockResolvedValue({
      uuid: "verification-uuid",
      userUuid: "user-uuid",
      provider: "mock",
      providerReference: "mock-ref",
      verificationType: "individual",
      status: "manual_review",
      amlStatus: "review",
      riskLevel: "medium",
      fullName: "Ada Lovelace",
      documentType: "passport",
      documentNumberMasked: "****2345",
      countryCode: "BR",
      birthDate: null,
      reviewedAt: null,
      requirements: ["proof_of_address"],
      createdAt: new Date("2026-04-01T10:05:00.000Z"),
      updatedAt: new Date("2026-04-01T10:05:00.000Z"),
    });
    vi.mocked(kycService.getRequirements).mockResolvedValue({
      status: "manual_review",
      requirements: ["proof_of_address"],
    });

    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService,
      kycService,
    });

    const headers = {
      authorization: `Bearer ${signAccessToken({
        sub: "user-uuid",
        email: "user@example.com",
      })}`,
    };

    const latestResponse = await server.inject({
      method: "GET",
      url: "/kyc/submissions/latest",
      headers,
    });

    expect(latestResponse.statusCode).toBe(200);
    expect(latestResponse.json()).toMatchObject({
      verification: {
        uuid: "verification-uuid",
        status: "manual_review",
      },
    });

    const requirementsResponse = await server.inject({
      method: "GET",
      url: "/kyc/requirements",
      headers,
    });

    expect(requirementsResponse.statusCode).toBe(200);
    expect(requirementsResponse.json()).toEqual({
      status: "manual_review",
      requirements: ["proof_of_address"],
    });
  });
});
