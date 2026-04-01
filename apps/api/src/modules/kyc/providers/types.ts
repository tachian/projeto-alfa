export type SubmitKycCheckInput = {
  userUuid: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  countryCode: string;
  birthDate?: Date | null;
};

export type KycProviderResult = {
  provider: string;
  providerReference: string;
  status: "approved" | "manual_review" | "rejected";
  amlStatus: "clear" | "review" | "flagged";
  riskLevel: "low" | "medium" | "high";
  reviewedAt: Date | null;
  requirements: string[];
  providerPayload: Record<string, unknown>;
};

export interface KycProviderContract {
  submitCheck(input: SubmitKycCheckInput): Promise<KycProviderResult>;
}
