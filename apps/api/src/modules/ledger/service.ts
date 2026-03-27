import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import type {
  AccountBalance,
  InternalAccountType,
  LedgerEntryDraft,
  PostLedgerTransactionInput,
} from "./types.js";

const ZERO = new Prisma.Decimal(0);
type LedgerDbClient = typeof prisma | Prisma.TransactionClient;

export const INTERNAL_ACCOUNT_TYPES = {
  available: "available",
  reserved: "reserved",
  fee: "fee",
  custody: "custody",
} as const satisfies Record<InternalAccountType, InternalAccountType>;

export class LedgerError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "LedgerError";
  }
}

const toDecimal = (value: Prisma.Decimal | number | string) => {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
};

const normalizeEntryAmount = (entry: LedgerEntryDraft) => {
  const amount = toDecimal(entry.amount);

  if (amount.lte(ZERO)) {
    throw new LedgerError("Ledger entry amount must be greater than zero.", 400);
  }

  return amount;
};

export class LedgerService {
  async ensureAccount(input: {
    userUuid?: string;
    accountType: string;
    currency?: string;
    status?: string;
  }, dbClient: LedgerDbClient = prisma) {
    const currency = input.currency ?? "USD";
    const status = input.status ?? "active";

    const existingAccount = input.userUuid
      ? await dbClient.account.findUnique({
          where: {
            userUuid_accountType_currency: {
              userUuid: input.userUuid,
              accountType: input.accountType,
              currency,
            },
          },
        })
      : await dbClient.account.findFirst({
          where: {
            userUuid: null,
            accountType: input.accountType,
            currency,
          },
        });

    if (existingAccount) {
      return existingAccount;
    }

    return dbClient.account.create({
      data: {
        userUuid: input.userUuid,
        accountType: input.accountType,
        currency,
        status,
      },
    });
  }

  async postTransaction(
    input: PostLedgerTransactionInput,
    options?: {
      dbClient?: LedgerDbClient;
      skipAuditLog?: boolean;
    },
  ) {
    const dbClient = options?.dbClient ?? prisma;

    if (input.entries.length < 2) {
      throw new LedgerError("A double-entry transaction requires at least two entries.", 400);
    }

    const accountUuids = [...new Set(input.entries.map((entry) => entry.accountUuid))];
    const accounts = await dbClient.account.findMany({
      where: {
        uuid: {
          in: accountUuids,
        },
      },
    });

    if (accounts.length !== accountUuids.length) {
      throw new LedgerError("One or more ledger accounts were not found.", 404);
    }

    const accountByUuid = new Map(accounts.map((account) => [account.uuid, account]));
    const currencies = new Set(accounts.map((account) => account.currency));

    if (currencies.size > 1) {
      throw new LedgerError("All ledger entries in a transaction must share the same currency.", 400);
    }

    let debitTotal = ZERO;
    let creditTotal = ZERO;

    const preparedEntries = input.entries.map((entry) => {
      const amount = normalizeEntryAmount(entry);

      if (entry.direction === "debit") {
        debitTotal = debitTotal.plus(amount);
      } else {
        creditTotal = creditTotal.plus(amount);
      }

      return {
        account: accountByUuid.get(entry.accountUuid)!,
        amount,
        entry,
      };
    });

    if (!debitTotal.equals(creditTotal)) {
      throw new LedgerError("Ledger transaction is not balanced.", 400);
    }

    const persistEntries = async (tx: LedgerDbClient) => {
      const transaction = await tx.ledgerTransaction.create({
        data: {
          transactionType: input.transactionType,
          referenceType: input.referenceType,
          referenceUuid: input.referenceUuid,
          description: input.description,
          metadata: input.metadata,
        },
      });

      const entries = await Promise.all(
        preparedEntries.map(({ account, amount, entry }) => {
          const resolvedUserUuid = entry.userUuid ?? account.userUuid;

          return tx.ledgerEntry.create({
            data: {
              transaction: {
                connect: {
                  uuid: transaction.uuid,
                },
              },
              account: {
                connect: {
                  uuid: account.uuid,
                },
              },
              user: resolvedUserUuid
                ? {
                    connect: {
                      uuid: resolvedUserUuid,
                    },
                  }
                : undefined,
              entryType: entry.entryType,
              amount,
              direction: entry.direction,
              referenceType: entry.referenceType,
              referenceUuid: entry.referenceUuid,
              metadata: entry.metadata,
            },
          });
        }),
      );

      return {
        transaction,
        entries,
      };
    };

    const result =
      dbClient === prisma
        ? await prisma.$transaction(async (transactionClient) => persistEntries(transactionClient))
        : await persistEntries(dbClient);

    if (!options?.skipAuditLog) {
      await writeAuditLog({
        action: "ledger.transaction.posted",
        targetType: "ledger_transaction",
        targetUuid: result.transaction.uuid,
        payload: {
          transactionType: result.transaction.transactionType,
          entryCount: result.entries.length,
          referenceType: result.transaction.referenceType,
          referenceUuid: result.transaction.referenceUuid,
        },
      });
    }

    return result;
  }

  async getAccountBalance(accountUuid: string, dbClient: LedgerDbClient = prisma): Promise<AccountBalance> {
    const account = await dbClient.account.findUnique({
      where: {
        uuid: accountUuid,
      },
    });

    if (!account) {
      throw new LedgerError("Ledger account not found.", 404);
    }

    const aggregates = await dbClient.ledgerEntry.groupBy({
      by: ["direction"],
      where: {
        accountUuid,
      },
      _sum: {
        amount: true,
      },
    });

    const totals = new Map(
      aggregates.map((aggregate) => [
        aggregate.direction,
        aggregate._sum.amount ?? ZERO,
      ]),
    );

    const debits = totals.get("debit") ?? ZERO;
    const credits = totals.get("credit") ?? ZERO;
    const available = credits.minus(debits);

    return {
      accountUuid: account.uuid,
      currency: account.currency,
      available: available.toFixed(4),
    };
  }

  async ensureUserAccounts(input: {
    userUuid: string;
    currency?: string;
  }, dbClient: LedgerDbClient = prisma) {
    const currency = input.currency ?? "USD";

    const [available, reserved] = await Promise.all([
      this.ensureAccount({
        userUuid: input.userUuid,
        accountType: INTERNAL_ACCOUNT_TYPES.available,
        currency,
      }, dbClient),
      this.ensureAccount({
        userUuid: input.userUuid,
        accountType: INTERNAL_ACCOUNT_TYPES.reserved,
        currency,
      }, dbClient),
    ]);

    return {
      available,
      reserved,
    };
  }

  async ensurePlatformAccounts(input?: {
    currency?: string;
  }, dbClient: LedgerDbClient = prisma) {
    const currency = input?.currency ?? "USD";

    const [fee, custody] = await Promise.all([
      this.ensureAccount({
        accountType: INTERNAL_ACCOUNT_TYPES.fee,
        currency,
      }, dbClient),
      this.ensureAccount({
        accountType: INTERNAL_ACCOUNT_TYPES.custody,
        currency,
      }, dbClient),
    ]);

    return {
      fee,
      custody,
    };
  }

  async ensureInternalAccounts(input: {
    userUuid: string;
    currency?: string;
  }, dbClient: LedgerDbClient = prisma) {
    const [userAccounts, platformAccounts] = await Promise.all([
      this.ensureUserAccounts(input, dbClient),
      this.ensurePlatformAccounts({
        currency: input.currency,
      }, dbClient),
    ]);

    return {
      ...userAccounts,
      ...platformAccounts,
    };
  }
}
