import { prisma } from "../../lib/prisma.js";
import { LedgerService } from "../ledger/service.js";

const DEFAULT_CURRENCY = "USD";
const DEFAULT_STATEMENT_LIMIT = 50;
const MAX_STATEMENT_LIMIT = 100;

export type WalletBalanceResult = {
  currency: string;
  available: string;
  reserved: string;
  total: string;
  accounts: {
    available: {
      uuid: string;
      balance: string;
    };
    reserved: {
      uuid: string;
      balance: string;
    };
  };
};

export type WalletStatementEntry = {
  uuid: string;
  transactionUuid: string;
  accountUuid: string;
  accountType: string;
  entryType: string;
  amount: string;
  direction: string;
  referenceType: string;
  referenceUuid: string | null;
  description: string | null;
  createdAt: Date;
  metadata: unknown;
};

export type WalletStatementResult = {
  entries: WalletStatementEntry[];
  meta: {
    count: number;
    limit: number;
    currency: string;
  };
};

export interface WalletServiceContract {
  getBalance(userUuid: string, currency?: string): Promise<WalletBalanceResult>;
  getStatement(input: {
    userUuid: string;
    currency?: string;
    limit?: number;
  }): Promise<WalletStatementResult>;
}

export class WalletService implements WalletServiceContract {
  constructor(private readonly ledgerService = new LedgerService()) {}

  async getBalance(userUuid: string, currency = DEFAULT_CURRENCY): Promise<WalletBalanceResult> {
    const accounts = await this.ledgerService.ensureUserAccounts({
      userUuid,
      currency,
    });

    const [availableBalance, reservedBalance] = await Promise.all([
      this.ledgerService.getAccountBalance(accounts.available.uuid),
      this.ledgerService.getAccountBalance(accounts.reserved.uuid),
    ]);

    const total = (
      Number.parseFloat(availableBalance.available) + Number.parseFloat(reservedBalance.available)
    ).toFixed(4);

    return {
      currency,
      available: availableBalance.available,
      reserved: reservedBalance.available,
      total,
      accounts: {
        available: {
          uuid: accounts.available.uuid,
          balance: availableBalance.available,
        },
        reserved: {
          uuid: accounts.reserved.uuid,
          balance: reservedBalance.available,
        },
      },
    };
  }

  async getStatement(input: {
    userUuid: string;
    currency?: string;
    limit?: number;
  }): Promise<WalletStatementResult> {
    const currency = input.currency ?? DEFAULT_CURRENCY;
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_STATEMENT_LIMIT, 1), MAX_STATEMENT_LIMIT);

    await this.ledgerService.ensureUserAccounts({
      userUuid: input.userUuid,
      currency,
    });

    const entries = await prisma.ledgerEntry.findMany({
      where: {
        account: {
          userUuid: input.userUuid,
          currency,
          accountType: {
            in: ["available", "reserved"],
          },
        },
      },
      include: {
        account: {
          select: {
            uuid: true,
            accountType: true,
          },
        },
        transaction: {
          select: {
            uuid: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return {
      entries: entries.map((entry) => ({
        uuid: entry.uuid,
        transactionUuid: entry.transactionUuid,
        accountUuid: entry.accountUuid,
        accountType: entry.account.accountType,
        entryType: entry.entryType,
        amount: entry.amount.toFixed(4),
        direction: entry.direction,
        referenceType: entry.referenceType,
        referenceUuid: entry.referenceUuid,
        description: entry.transaction.description,
        createdAt: entry.createdAt,
        metadata: entry.metadata,
      })),
      meta: {
        count: entries.length,
        limit,
        currency,
      },
    };
  }
}
