import { appConfig } from "../../../config.js";
import type { KycProviderContract, KycProviderResult, SubmitKycCheckInput } from "./types.js";

const buildResult = (
  input: SubmitKycCheckInput,
  result: Pick<KycProviderResult, "status" | "amlStatus" | "riskLevel" | "requirements">,
): KycProviderResult => ({
  provider: "mock",
  providerReference: `mock-${crypto.randomUUID()}`,
  status: result.status,
  amlStatus: result.amlStatus,
  riskLevel: result.riskLevel,
  reviewedAt: result.status === "manual_review" ? null : new Date(),
  requirements: result.requirements,
  providerPayload: {
    simulated: true,
    fullName: input.fullName,
    documentType: input.documentType,
    countryCode: input.countryCode,
    policy: "document suffix routing",
  },
});

export class MockKycProvider implements KycProviderContract {
  async submitCheck(input: SubmitKycCheckInput): Promise<KycProviderResult> {
    const suffix = input.documentNumber.slice(-3);

    if (suffix === "999") {
      return buildResult(input, {
        status: "rejected",
        amlStatus: "flagged",
        riskLevel: "high",
        requirements: ["contact_support"],
      });
    }

    if (suffix === "111") {
      return buildResult(input, {
        status: "manual_review",
        amlStatus: "review",
        riskLevel: "medium",
        requirements: ["proof_of_address", "source_of_funds"],
      });
    }

    return buildResult(input, {
      status: appConfig.KYC_MOCK_DEFAULT_STATUS,
      amlStatus: appConfig.KYC_MOCK_DEFAULT_STATUS === "rejected" ? "flagged" : appConfig.KYC_MOCK_DEFAULT_STATUS === "manual_review" ? "review" : "clear",
      riskLevel: appConfig.KYC_MOCK_DEFAULT_STATUS === "rejected" ? "high" : appConfig.KYC_MOCK_DEFAULT_STATUS === "manual_review" ? "medium" : "low",
      requirements: appConfig.KYC_MOCK_DEFAULT_STATUS === "approved" ? [] : ["proof_of_address"],
    });
  }
}
