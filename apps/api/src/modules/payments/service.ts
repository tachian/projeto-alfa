import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { AccountStateError, AccountStateService, type AccountStateServiceContract } from "../account-state/service.js";
import { LedgerError, LedgerService } from "../ledger/service.js";
import { RiskError, RiskService, type RiskServiceContract } from "../risk/service.js";

const DEFAULT_CURRENCY = "USD";
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;
const ZERO = new Prisma.Decimal(0);

export type PaymentType = "deposit" | "withdrawal";

export type PaymentRecord = {
  uuid: string;
  type: string;
  status: string;
  provider: string;
  amount: string;
  currency: string;
  description: string | null;
  idempotencyKey: string | null;
  ledgerTransactionUuid: string | null;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
  metadata: unknown;
};

export type CreatePaymentInput = {
  userUuid: string;
  amount: Prisma.Decimal | number | string;
  currency?: string;
  description?: string;
  idempotencyKey?: string;
  metadata?: Prisma.InputJsonValue;
};

export type ListPaymentsInput = {
  userUuid: string;
  type: PaymentType;
  currency?: string;
  limit?: number;
};

export type ListPaymentsResult = {
  items: PaymentRecord[];
  meta: {
    count: number;
    limit: number;
    type: PaymentType;
    currency: string;
  };
};

export interface PaymentServiceContract {
  createDeposit(input: CreatePaymentInput): Promise<PaymentRecord>;
  createWithdrawal(input: CreatePaymentInput): Promise<PaymentRecord>;
  listPayments(input: ListPaymentsInput): Promise<ListPaymentsResult>;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

const toDecimal = (value: Prisma.Decimal | number | string) => {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
};

const normalizePositiveAmount = (amount: Prisma.Decimal | number | string) => {
  const normalizedAmount = toDecimal(amount);

  if (normalizedAmount.lte(ZERO)) {
    throw new PaymentError("O valor deve ser maior que zero.", 400);
  }

  return normalizedAmount;
};

const mapPayment = (payment: {
  uuid: string;
  type: string;
  status: string;
  provider: string;
  amount: Prisma.Decimal;
  currency: string;
  description: string | null;
  idempotencyKey: string | null;
  ledgerTransactionUuid: string | null;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
  metadata: Prisma.JsonValue | null;
}): PaymentRecord => ({
  uuid: payment.uuid,
  type: payment.type,
  status: payment.status,
  provider: payment.provider,
  amount: payment.amount.toFixed(4),
  currency: payment.currency,
  description: payment.description,
  idempotencyKey: payment.idempotencyKey,
  ledgerTransactionUuid: payment.ledgerTransactionUuid,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
  processedAt: payment.processedAt,
  metadata: payment.metadata,
});

export class PaymentService implements PaymentServiceContract {
  constructor(
    private readonly ledgerService = new LedgerService(),
    private readonly accountStateService: AccountStateServiceContract = new AccountStateService(),
    private readonly riskService: RiskServiceContract = new RiskService(),
  ) {}

  async createDeposit(input: CreatePaymentInput): Promise<PaymentRecord> {
    return this.createPayment({
      ...input,
      type: "deposit",
    });
  }

  async createWithdrawal(input: CreatePaymentInput): Promise<PaymentRecord> {
    return this.createPayment({
      ...input,
      type: "withdrawal",
    });
  }

  async listPayments(input: ListPaymentsInput): Promise<ListPaymentsResult> {
    const currency = (input.currency ?? DEFAULT_CURRENCY).toUpperCase();
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIST_LIMIT, 1), MAX_LIST_LIMIT);

    const items = await prisma.payment.findMany({
      where: {
        userUuid: input.userUuid,
        type: input.type,
        currency,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return {
      items: items.map(mapPayment),
      meta: {
        count: items.length,
        limit,
        type: input.type,
        currency,
      },
    };
  }

  private async createPayment(input: CreatePaymentInput & { type: PaymentType }): Promise<PaymentRecord> {
    const amount = normalizePositiveAmount(input.amount);
    const currency = (input.currency ?? DEFAULT_CURRENCY).toUpperCase();
    const idempotencyKey = input.idempotencyKey?.trim() || undefined;

    if (input.type === "deposit") {
      await this.accountStateService.assertCanCreateDeposit(input.userUuid);
    } else {
      await this.accountStateService.assertCanCreateWithdrawal(input.userUuid);
    }

    if (idempotencyKey) {
      const existingPayment = await prisma.payment.findFirst({
        where: {
          userUuid: input.userUuid,
          type: input.type,
          idempotencyKey,
        },
      });

      if (existingPayment) {
        if (
          !existingPayment.amount.equals(amount) ||
          existingPayment.currency !== currency ||
          existingPayment.description !== (input.description ?? null)
        ) {
          throw new PaymentError("Idempotency-Key ja utilizado com payload diferente.", 409);
        }

        return mapPayment(existingPayment);
      }
    }

    try {
      const completedPayment = await prisma.$transaction(async (tx) => {
        const accounts = await this.ledgerService.ensureInternalAccounts(
          {
            userUuid: input.userUuid,
            currency,
          },
          tx,
        );

        if (input.type === "withdrawal") {
          await this.riskService.assertWithdrawalWithinLimits({
            dbClient: tx,
            userUuid: input.userUuid,
            amount,
            currency,
          });

          const availableBalance = await this.ledgerService.getAccountBalance(accounts.available.uuid, tx);
          const availableAmount = new Prisma.Decimal(availableBalance.available);

          if (availableAmount.lt(amount)) {
            throw new PaymentError("Saldo insuficiente para saque.", 400);
          }
        }

        const payment = await tx.payment.create({
          data: {
            userUuid: input.userUuid,
            type: input.type,
            status: "pending",
            provider: "manual",
            idempotencyKey,
            amount,
            currency,
            description: input.description,
            metadata: input.metadata,
          },
        });

        const ledgerResult = await this.ledgerService.postTransaction(
          {
            transactionType: input.type,
            referenceType: "payment",
            referenceUuid: payment.uuid,
            description:
              input.description ??
              (input.type === "deposit" ? "Manual mock deposit" : "Manual mock withdrawal"),
            metadata: {
              paymentType: input.type,
              provider: "manual",
              idempotencyKey: idempotencyKey ?? null,
            },
            entries:
              input.type === "deposit"
                ? [
                    {
                      accountUuid: accounts.available.uuid,
                      userUuid: input.userUuid,
                      entryType: "deposit_completed",
                      amount,
                      direction: "credit",
                      referenceType: "payment",
                      referenceUuid: payment.uuid,
                    },
                    {
                      accountUuid: accounts.custody.uuid,
                      entryType: "deposit_completed",
                      amount,
                      direction: "debit",
                      referenceType: "payment",
                      referenceUuid: payment.uuid,
                    },
                  ]
                : [
                    {
                      accountUuid: accounts.available.uuid,
                      userUuid: input.userUuid,
                      entryType: "withdrawal_completed",
                      amount,
                      direction: "debit",
                      referenceType: "payment",
                      referenceUuid: payment.uuid,
                    },
                    {
                      accountUuid: accounts.custody.uuid,
                      entryType: "withdrawal_completed",
                      amount,
                      direction: "credit",
                      referenceType: "payment",
                      referenceUuid: payment.uuid,
                    },
                  ],
          },
          {
            dbClient: tx,
            skipAuditLog: true,
          },
        );

        return tx.payment.update({
          where: {
            uuid: payment.uuid,
          },
          data: {
            status: "completed",
            processedAt: new Date(),
            ledgerTransactionUuid: ledgerResult.transaction.uuid,
          },
        });
      });

      await writeAuditLog({
        action: `payments.${input.type}.completed`,
        targetType: "payment",
        targetUuid: completedPayment.uuid,
        payload: {
          amount: completedPayment.amount.toFixed(4),
          currency: completedPayment.currency,
          userUuid: completedPayment.userUuid,
          idempotencyKey: completedPayment.idempotencyKey,
        },
      });

      return mapPayment(completedPayment);
    } catch (error) {
      if (error instanceof PaymentError || error instanceof LedgerError || error instanceof AccountStateError || error instanceof RiskError) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        idempotencyKey
      ) {
        const existingPayment = await prisma.payment.findFirst({
          where: {
            userUuid: input.userUuid,
            type: input.type,
            idempotencyKey,
          },
        });

        if (existingPayment) {
          return mapPayment(existingPayment);
        }
      }

      throw error;
    }
  }
}
