import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { createKycProvider } from "./providers/index.js";
import type { KycProviderContract } from "./providers/types.js";

const prismaKyc = prisma as typeof prisma & {
  identityVerification: {
    create: (args: unknown) => Promise<any>;
    findFirst: (args: unknown) => Promise<any>;
  };
};

export type KycSubmissionInput = {
  userUuid: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  countryCode: string;
  birthDate?: Date | null;
};

export type KycVerificationRecord = {
  uuid: string;
  userUuid: string;
  provider: string;
  providerReference: string | null;
  verificationType: string;
  status: string;
  amlStatus: string;
  riskLevel: string;
  fullName: string;
  documentType: string;
  documentNumberMasked: string;
  countryCode: string;
  birthDate: Date | null;
  reviewedAt: Date | null;
  requirements: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type KycRequirementsRecord = {
  status: "required" | "pending" | "approved" | "manual_review" | "rejected";
  requirements: string[];
};

export interface KycServiceContract {
  submitVerification(input: KycSubmissionInput): Promise<KycVerificationRecord>;
  getLatestVerification(userUuid: string): Promise<KycVerificationRecord | null>;
  getRequirements(userUuid: string): Promise<KycRequirementsRecord>;
}

export class KycError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "KycError";
  }
}

const maskDocumentNumber = (documentNumber: string) => {
  if (documentNumber.length <= 4) {
    return "*".repeat(documentNumber.length);
  }

  return `${"*".repeat(documentNumber.length - 4)}${documentNumber.slice(-4)}`;
};

const mapVerification = (verification: {
  uuid: string;
  userUuid: string;
  provider: string;
  providerReference: string | null;
  verificationType: string;
  status: string;
  amlStatus: string;
  riskLevel: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  countryCode: string;
  birthDate: Date | null;
  reviewedAt: Date | null;
  requirements: unknown;
  createdAt: Date;
  updatedAt: Date;
}): KycVerificationRecord => ({
  uuid: verification.uuid,
  userUuid: verification.userUuid,
  provider: verification.provider,
  providerReference: verification.providerReference,
  verificationType: verification.verificationType,
  status: verification.status,
  amlStatus: verification.amlStatus,
  riskLevel: verification.riskLevel,
  fullName: verification.fullName,
  documentType: verification.documentType,
  documentNumberMasked: maskDocumentNumber(verification.documentNumber),
  countryCode: verification.countryCode,
  birthDate: verification.birthDate,
  reviewedAt: verification.reviewedAt,
  requirements: Array.isArray(verification.requirements)
    ? verification.requirements.filter((item): item is string => typeof item === "string")
    : [],
  createdAt: verification.createdAt,
  updatedAt: verification.updatedAt,
});

const deriveUserStatusFromKyc = (status: string) => {
  if (status === "approved") {
    return "active";
  }

  if (status === "rejected") {
    return "restricted";
  }

  return "pending_verification";
};

export class KycService implements KycServiceContract {
  constructor(private readonly provider: KycProviderContract = createKycProvider()) {}

  async submitVerification(input: KycSubmissionInput): Promise<KycVerificationRecord> {
    const user = await prisma.user.findUnique({
      where: {
        uuid: input.userUuid,
      },
    });

    if (!user) {
      throw new KycError("Usuario nao encontrado para verificacao.", 404);
    }

    const providerResult = await this.provider.submitCheck(input);

    const verification = await prisma.$transaction(async (tx) => {
      const txKyc = tx as typeof prismaKyc;
      const created = await txKyc.identityVerification.create({
        data: {
          userUuid: input.userUuid,
          provider: providerResult.provider,
          providerReference: providerResult.providerReference,
          verificationType: "individual",
          status: providerResult.status,
          amlStatus: providerResult.amlStatus,
          riskLevel: providerResult.riskLevel,
          fullName: input.fullName,
          documentType: input.documentType,
          documentNumber: input.documentNumber,
          countryCode: input.countryCode,
          birthDate: input.birthDate ?? null,
          reviewedAt: providerResult.reviewedAt,
          requirements: providerResult.requirements,
          providerPayload: providerResult.providerPayload,
        },
      });

      await txKyc.user.update({
        where: {
          uuid: input.userUuid,
        },
        data: {
          status: deriveUserStatusFromKyc(providerResult.status),
        },
      });

      return created;
    });

    await writeAuditLog({
      action: "kyc.submission.created",
      targetType: "identity_verification",
      targetUuid: verification.uuid,
      payload: {
        userUuid: verification.userUuid,
        provider: verification.provider,
        status: verification.status,
        amlStatus: verification.amlStatus,
      },
    });

    return mapVerification(verification);
  }

  async getLatestVerification(userUuid: string): Promise<KycVerificationRecord | null> {
    const verification = await prismaKyc.identityVerification.findFirst({
      where: {
        userUuid,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return verification ? mapVerification(verification) : null;
  }

  async getRequirements(userUuid: string): Promise<KycRequirementsRecord> {
    const latest = await this.getLatestVerification(userUuid);

    if (!latest) {
      return {
        status: "required",
        requirements: ["identity_document", "personal_information"],
      };
    }

    if (latest.status === "approved") {
      return {
        status: "approved",
        requirements: [],
      };
    }

    return {
      status: latest.status as KycRequirementsRecord["status"],
      requirements: latest.requirements.length > 0 ? latest.requirements : ["manual_review"],
    };
  }
}
