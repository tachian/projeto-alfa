import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { KycService } from "./service.js";
import type { KycProviderContract } from "./providers/types.js";

const prismaMock = prisma as typeof prisma & {
  identityVerification: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
};

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    identityVerification: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../lib/audit.js", () => ({
  writeAuditLog: vi.fn(),
}));

describe("KycService", () => {
  const provider: KycProviderContract = {
    submitCheck: vi.fn(),
  };

  let service: KycService;

  beforeEach(() => {
    service = new KycService(provider);
    vi.clearAllMocks();
  });

  it("creates a verification using the provider result", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      uuid: "user-uuid",
      email: "user@example.com",
      passwordHash: "hash",
      role: "user",
      status: "active",
      createdAt: new Date("2026-04-01T10:00:00.000Z"),
      updatedAt: new Date("2026-04-01T10:00:00.000Z"),
    });

    vi.mocked(provider.submitCheck).mockResolvedValue({
      provider: "mock",
      providerReference: "mock-ref",
      status: "approved",
      amlStatus: "clear",
      riskLevel: "low",
      reviewedAt: new Date("2026-04-01T10:05:00.000Z"),
      requirements: [],
      providerPayload: {
        simulated: true,
      },
    });

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        identityVerification: {
          create: vi.fn().mockResolvedValue({
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
            documentNumber: "ABC12345",
            countryCode: "BR",
            birthDate: new Date("1990-01-01T00:00:00.000Z"),
            reviewedAt: new Date("2026-04-01T10:05:00.000Z"),
            requirements: [],
            providerPayload: {
              simulated: true,
            },
            createdAt: new Date("2026-04-01T10:05:00.000Z"),
            updatedAt: new Date("2026-04-01T10:05:00.000Z"),
          }),
        },
        user: {
          update: vi.fn().mockResolvedValue(undefined),
        },
      } as never),
    );

    const result = await service.submitVerification({
      userUuid: "user-uuid",
      fullName: "Ada Lovelace",
      documentType: "passport",
      documentNumber: "ABC12345",
      countryCode: "BR",
      birthDate: new Date("1990-01-01T00:00:00.000Z"),
    });

    expect(result).toMatchObject({
      uuid: "verification-uuid",
      status: "approved",
      amlStatus: "clear",
      riskLevel: "low",
      documentNumberMasked: "****2345",
    });
  });

  it("returns default requirements when the user has no verification yet", async () => {
    prismaMock.identityVerification.findFirst.mockResolvedValue(null);

    await expect(service.getRequirements("user-uuid")).resolves.toEqual({
      status: "required",
      requirements: ["identity_document", "personal_information"],
    });
  });
});
