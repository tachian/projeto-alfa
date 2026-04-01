import { appConfig } from "../../../config.js";
import { MockKycProvider } from "./mock-provider.js";
import type { KycProviderContract } from "./types.js";

export const createKycProvider = (): KycProviderContract => {
  switch (appConfig.KYC_PROVIDER) {
    case "mock":
    default:
      return new MockKycProvider();
  }
};
