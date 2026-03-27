export const MARKET_STATUSES = [
  "draft",
  "open",
  "suspended",
  "closed",
  "resolving",
  "resolved",
  "cancelled",
] as const;

export type MarketStatus = (typeof MARKET_STATUSES)[number];

export const MARKET_OUTCOME_TYPES = ["binary"] as const;
export type MarketOutcomeType = (typeof MARKET_OUTCOME_TYPES)[number];
