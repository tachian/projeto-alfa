import type { Prisma } from "@prisma/client";

export type LedgerDirection = "credit" | "debit";
export type InternalAccountType = "available" | "reserved" | "fee" | "custody";

export type LedgerEntryDraft = {
  accountUuid: string;
  userUuid?: string;
  entryType: string;
  amount: Prisma.Decimal | number | string;
  direction: LedgerDirection;
  referenceType: string;
  referenceUuid?: string;
  metadata?: Prisma.InputJsonValue;
};

export type PostLedgerTransactionInput = {
  transactionType: string;
  referenceType?: string;
  referenceUuid?: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
  entries: [LedgerEntryDraft, LedgerEntryDraft, ...LedgerEntryDraft[]];
};

export type AccountBalance = {
  accountUuid: string;
  currency: string;
  available: string;
};
