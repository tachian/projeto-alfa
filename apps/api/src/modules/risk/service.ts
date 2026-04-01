import { Prisma } from "@prisma/client";
import { appConfig, type AppConfig } from "../../config.js";
import { prisma } from "../../lib/prisma.js";

const OPEN_ORDER_STATUSES = ["open", "partially_filled"] as const;
const ZERO = new Prisma.Decimal(0);

type RiskDbClient = Prisma.TransactionClient | typeof prisma;

export class RiskError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "RiskError";
  }
}

export interface RiskServiceContract {
  assertOrderWithinLimits(input: {
    dbClient?: RiskDbClient;
    userUuid: string;
    marketUuid: string;
    reserveAmount: Prisma.Decimal;
    quantity: number;
  }): Promise<void>;
  assertWithdrawalWithinLimits(input: {
    dbClient?: RiskDbClient;
    userUuid: string;
    amount: Prisma.Decimal;
    currency: string;
    now?: Date;
  }): Promise<void>;
}

export class RiskService implements RiskServiceContract {
  constructor(private readonly config: AppConfig = appConfig) {}

  async assertOrderWithinLimits(input: {
    dbClient?: RiskDbClient;
    userUuid: string;
    marketUuid: string;
    reserveAmount: Prisma.Decimal;
    quantity: number;
  }) {
    const dbClient = input.dbClient ?? prisma;

    if (input.quantity > this.config.RISK_MAX_ORDER_QUANTITY) {
      throw new RiskError("A quantidade excede o limite por ordem.", 403);
    }

    if (input.reserveAmount.gt(new Prisma.Decimal(this.config.RISK_MAX_ORDER_RESERVE_AMOUNT))) {
      throw new RiskError("O valor reservado excede o limite por ordem.", 403);
    }

    const [openOrders, positions] = await Promise.all([
      dbClient.order.findMany({
        where: {
          userUuid: input.userUuid,
          marketUuid: input.marketUuid,
          status: {
            in: [...OPEN_ORDER_STATUSES],
          },
        },
        select: {
          remainingQuantity: true,
        },
      }),
      dbClient.position.findMany({
        where: {
          userUuid: input.userUuid,
          marketUuid: input.marketUuid,
        },
        select: {
          netQuantity: true,
        },
      }),
    ]);

    if (openOrders.length >= this.config.RISK_MAX_OPEN_ORDERS_PER_MARKET) {
      throw new RiskError("Voce atingiu o limite de ordens abertas neste mercado.", 403);
    }

    const currentGrossExposure =
      openOrders.reduce((total, order) => total + Math.abs(order.remainingQuantity), 0) +
      positions.reduce((total, position) => total + Math.abs(position.netQuantity), 0);

    const projectedGrossExposure = currentGrossExposure + Math.abs(input.quantity);

    if (projectedGrossExposure > this.config.RISK_MAX_GROSS_EXPOSURE_PER_MARKET) {
      throw new RiskError("A ordem ultrapassa o limite de exposicao bruta neste mercado.", 403);
    }
  }

  async assertWithdrawalWithinLimits(input: {
    dbClient?: RiskDbClient;
    userUuid: string;
    amount: Prisma.Decimal;
    currency: string;
    now?: Date;
  }) {
    const dbClient = input.dbClient ?? prisma;

    if (input.amount.gt(new Prisma.Decimal(this.config.RISK_MAX_WITHDRAWAL_AMOUNT))) {
      throw new RiskError("O valor do saque excede o limite por operacao.", 403);
    }

    const now = input.now ?? new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const aggregateResult = await dbClient.payment.aggregate({
      where: {
        userUuid: input.userUuid,
        type: "withdrawal",
        status: "completed",
        currency: input.currency,
        processedAt: {
          gte: dayStart,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const currentTotal = aggregateResult._sum.amount ?? ZERO;
    const projectedTotal = currentTotal.plus(input.amount);

    if (projectedTotal.gt(new Prisma.Decimal(this.config.RISK_MAX_DAILY_WITHDRAWAL_AMOUNT))) {
      throw new RiskError("O limite diario de saques foi excedido para esta conta.", 403);
    }
  }
}
