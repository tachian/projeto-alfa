import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { AccountStateError, AccountStateService, type AccountStateServiceContract } from "../account-state/service.js";
import type { LedgerEntryDraft } from "../ledger/types.js";
import { LedgerError, LedgerService } from "../ledger/service.js";
import { RealtimePublisher, type RealtimePublisherContract } from "../realtime/publisher.js";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;
const ORDER_SIDES = ["buy", "sell"] as const;
const ORDER_OUTCOMES = ["YES", "NO"] as const;
const ORDER_TYPES = ["limit"] as const;
const CANCELABLE_ORDER_STATUSES = ["open", "partially_filled"] as const;
const MATCHABLE_ORDER_STATUSES = ["open", "partially_filled"] as const;

export type OrderRecord = {
  uuid: string;
  userUuid: string;
  marketUuid: string;
  side: string;
  outcome: string;
  orderType: string;
  status: string;
  price: number;
  quantity: number;
  remainingQuantity: number;
  createdAt: Date;
  canceledAt: Date | null;
  market: {
    uuid: string;
    slug: string;
    title: string;
    status: string;
    closeAt: Date;
  };
};

export type CreateOrderInput = {
  userUuid: string;
  marketUuid: string;
  side: string;
  outcome: string;
  orderType?: string;
  price: number;
  quantity: number;
};

export type ListOrdersInput = {
  userUuid: string;
  marketUuid?: string;
  status?: string;
  limit?: number;
};

export type ListOrdersResult = {
  items: OrderRecord[];
  meta: {
    count: number;
    limit: number;
  };
};

export interface OrderServiceContract {
  createOrder(input: CreateOrderInput): Promise<OrderRecord>;
  listOrders(input: ListOrdersInput): Promise<ListOrdersResult>;
  cancelOrder(input: { userUuid: string; orderUuid: string }): Promise<OrderRecord>;
}

export class OrderError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "OrderError";
  }
}

const mapOrder = (order: {
  uuid: string;
  userUuid: string;
  marketUuid: string;
  side: string;
  outcome: string;
  orderType: string;
  status: string;
  price: number;
  quantity: number;
  remainingQuantity: number;
  createdAt: Date;
  canceledAt: Date | null;
  market: {
    uuid: string;
    slug: string;
    title: string;
    status: string;
    closeAt: Date;
  };
}): OrderRecord => ({
  uuid: order.uuid,
  userUuid: order.userUuid,
  marketUuid: order.marketUuid,
  side: order.side,
  outcome: order.outcome,
  orderType: order.orderType,
  status: order.status,
  price: order.price,
  quantity: order.quantity,
  remainingQuantity: order.remainingQuantity,
  createdAt: order.createdAt,
  canceledAt: order.canceledAt,
  market: {
    uuid: order.market.uuid,
    slug: order.market.slug,
    title: order.market.title,
    status: order.market.status,
    closeAt: order.market.closeAt,
  },
});

const assertOrderSide = (side: string) => {
  if (!ORDER_SIDES.includes(side as (typeof ORDER_SIDES)[number])) {
    throw new OrderError("Lado da ordem invalido.", 400);
  }
};

const assertOrderOutcome = (outcome: string) => {
  if (!ORDER_OUTCOMES.includes(outcome as (typeof ORDER_OUTCOMES)[number])) {
    throw new OrderError("Resultado da ordem invalido.", 400);
  }
};

const assertOrderType = (orderType: string) => {
  if (!ORDER_TYPES.includes(orderType as (typeof ORDER_TYPES)[number])) {
    throw new OrderError("Tipo de ordem invalido.", 400);
  }
};

const assertPrice = (price: number) => {
  if (!Number.isInteger(price) || price < 1 || price > 99) {
    throw new OrderError("O preco deve ser um inteiro entre 1 e 99.", 400);
  }
};

const assertQuantity = (quantity: number) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new OrderError("A quantidade deve ser um inteiro maior que zero.", 400);
  }
};

const assertMarketCanReceiveOrders = (market: {
  status: string;
  outcomeType: string;
  closeAt: Date;
}) => {
  if (market.status !== "open") {
    throw new OrderError("O mercado nao esta aberto para negociacao.", 400);
  }

  if (market.outcomeType !== "binary") {
    throw new OrderError("Apenas mercados binarios sao suportados neste MVP.", 400);
  }

  if (market.closeAt.getTime() <= Date.now()) {
    throw new OrderError("O mercado ja encerrou o periodo de negociacao.", 400);
  }
};

const getFilledStatus = (remainingQuantity: number) => (remainingQuantity === 0 ? "filled" : "partially_filled");

const ZERO_DECIMAL = new Prisma.Decimal(0);
const CENTS_IN_DOLLAR = new Prisma.Decimal(100);

export class OrderService implements OrderServiceContract {
  constructor(
    private readonly ledgerService = new LedgerService(),
    private readonly accountStateService: AccountStateServiceContract = new AccountStateService(),
    private readonly realtimePublisher: RealtimePublisherContract = new RealtimePublisher(),
  ) {}

  async createOrder(input: CreateOrderInput): Promise<OrderRecord> {
    const normalizedOrderType = input.orderType ?? "limit";

    assertOrderSide(input.side);
    assertOrderOutcome(input.outcome);
    assertOrderType(normalizedOrderType);
    assertPrice(input.price);
    assertQuantity(input.quantity);
    await this.accountStateService.assertCanCreateOrder(input.userUuid);

    const market = await prisma.market.findUnique({
      where: {
        uuid: input.marketUuid,
      },
    });

    if (!market) {
      throw new OrderError("Mercado nao encontrado.", 404);
    }

    assertMarketCanReceiveOrders(market);

    try {
      const matchedTrades: Array<{
        uuid: string;
        marketUuid: string;
        buyOrderUuid: string;
        sellOrderUuid: string;
        price: number;
        quantity: number;
        executedAt?: Date;
      }> = [];

      const order = await prisma.$transaction(async (tx) => {
        const accounts = await this.ledgerService.ensureUserAccounts(
          {
            userUuid: input.userUuid,
          },
          tx,
        );
        const availableBalance = await this.ledgerService.getAccountBalance(accounts.available.uuid, tx);
        const reserveAmount = this.calculateReserveAmount({
          side: input.side,
          price: input.price,
          quantity: input.quantity,
        });
        const availableAmount = new Prisma.Decimal(availableBalance.available);

        if (availableAmount.lt(reserveAmount)) {
          throw new OrderError("Saldo insuficiente para reservar a ordem.", 400);
        }

        const createdOrder = await tx.order.create({
          data: {
            userUuid: input.userUuid,
            marketUuid: input.marketUuid,
            side: input.side,
            outcome: input.outcome,
            orderType: normalizedOrderType,
            status: "open",
            price: input.price,
            quantity: input.quantity,
            remainingQuantity: input.quantity,
          },
          include: {
            market: {
              select: {
                uuid: true,
                slug: true,
                title: true,
                status: true,
                closeAt: true,
              },
            },
          },
        });

        const restingOrders = await tx.order.findMany({
          where: {
            marketUuid: input.marketUuid,
            outcome: input.outcome,
            side: input.side === "buy" ? "sell" : "buy",
            status: {
              in: [...MATCHABLE_ORDER_STATUSES],
            },
            userUuid: {
              not: input.userUuid,
            },
            ...(input.side === "buy"
              ? {
                  price: {
                    lte: input.price,
                  },
                }
              : {
                  price: {
                    gte: input.price,
                  },
                }),
          },
          include: {
            market: {
              select: {
                uuid: true,
                slug: true,
                title: true,
                status: true,
                closeAt: true,
              },
            },
          },
          orderBy:
            input.side === "buy"
              ? [{ price: "asc" }, { createdAt: "asc" }]
              : [{ price: "desc" }, { createdAt: "asc" }],
        });

        await this.ledgerService.postTransaction(
          {
            transactionType: "order_reserve",
            referenceType: "order",
            referenceUuid: createdOrder.uuid,
            description: "Order collateral reserved",
            metadata: {
              marketUuid: createdOrder.marketUuid,
              side: createdOrder.side,
              outcome: createdOrder.outcome,
              price: createdOrder.price,
              quantity: createdOrder.quantity,
            },
            entries: [
              {
                accountUuid: accounts.available.uuid,
                userUuid: input.userUuid,
                entryType: "order_reserved",
                amount: reserveAmount,
                direction: "debit",
                referenceType: "order",
                referenceUuid: createdOrder.uuid,
              },
              {
                accountUuid: accounts.reserved.uuid,
                userUuid: input.userUuid,
                entryType: "order_reserved",
                amount: reserveAmount,
                direction: "credit",
                referenceType: "order",
                referenceUuid: createdOrder.uuid,
              },
            ],
          },
          {
            dbClient: tx,
            skipAuditLog: true,
          },
        );

        let currentOrder = createdOrder;

        for (const restingOrder of restingOrders) {
          if (currentOrder.remainingQuantity === 0) {
            break;
          }

          const tradeQuantity = Math.min(currentOrder.remainingQuantity, restingOrder.remainingQuantity);

          if (tradeQuantity <= 0) {
            continue;
          }

          const tradePrice = restingOrder.price;
          const buyerOrder = currentOrder.side === "buy" ? currentOrder : restingOrder;
          const sellerOrder = currentOrder.side === "sell" ? currentOrder : restingOrder;
          const buyerTradeCost = this.calculateReserveAmount({
            side: "buy",
            price: tradePrice,
            quantity: tradeQuantity,
          });
          const sellerTradeCost = this.calculateReserveAmount({
            side: "sell",
            price: tradePrice,
            quantity: tradeQuantity,
          });
          const buyerReservedAtLimit = this.calculateReserveAmount({
            side: "buy",
            price: buyerOrder.price,
            quantity: tradeQuantity,
          });
          const sellerReservedAtLimit = this.calculateReserveAmount({
            side: "sell",
            price: sellerOrder.price,
            quantity: tradeQuantity,
          });
          const buyerReleaseAmount = buyerReservedAtLimit.minus(buyerTradeCost);
          const sellerReleaseAmount = sellerReservedAtLimit.minus(sellerTradeCost);

          const [buyerAccounts, sellerAccounts, platformAccounts] = await Promise.all([
            this.ledgerService.ensureUserAccounts(
              {
                userUuid: buyerOrder.userUuid,
              },
              tx,
            ),
            this.ledgerService.ensureUserAccounts(
              {
                userUuid: sellerOrder.userUuid,
              },
              tx,
            ),
            this.ledgerService.ensurePlatformAccounts(undefined, tx),
          ]);

          const trade = await tx.trade.create({
            data: {
              marketUuid: input.marketUuid,
              buyOrderUuid: buyerOrder.uuid,
              sellOrderUuid: sellerOrder.uuid,
              price: tradePrice,
              quantity: tradeQuantity,
            },
          });
          matchedTrades.push({
            uuid: trade.uuid,
            marketUuid: input.marketUuid,
            buyOrderUuid: buyerOrder.uuid,
            sellOrderUuid: sellerOrder.uuid,
            price: tradePrice,
            quantity: tradeQuantity,
            executedAt: trade.executedAt,
          });

          await Promise.all([
            this.applyTradeToPosition(
              {
                tx,
                userUuid: buyerOrder.userUuid,
                marketUuid: input.marketUuid,
                outcome: input.outcome,
                quantityDelta: tradeQuantity,
                executionPrice: tradePrice,
              },
            ),
            this.applyTradeToPosition(
              {
                tx,
                userUuid: sellerOrder.userUuid,
                marketUuid: input.marketUuid,
                outcome: input.outcome,
                quantityDelta: -tradeQuantity,
                executionPrice: tradePrice,
              },
            ),
          ]);

          const nextCurrentRemaining = currentOrder.remainingQuantity - tradeQuantity;
          const nextRestingRemaining = restingOrder.remainingQuantity - tradeQuantity;

          currentOrder = await tx.order.update({
            where: {
              uuid: currentOrder.uuid,
            },
            data: {
              remainingQuantity: nextCurrentRemaining,
              status: getFilledStatus(nextCurrentRemaining),
            },
            include: {
              market: {
                select: {
                  uuid: true,
                  slug: true,
                  title: true,
                  status: true,
                  closeAt: true,
                },
              },
            },
          });

          await tx.order.update({
            where: {
              uuid: restingOrder.uuid,
            },
            data: {
              remainingQuantity: nextRestingRemaining,
              status: getFilledStatus(nextRestingRemaining),
            },
          });

          const tradeEntries: [LedgerEntryDraft, LedgerEntryDraft, LedgerEntryDraft, ...LedgerEntryDraft[]] = [
            {
              accountUuid: buyerAccounts.reserved.uuid,
              userUuid: buyerOrder.userUuid,
              entryType: "trade_matched",
              amount: buyerTradeCost,
              direction: "debit" as const,
              referenceType: "trade",
              referenceUuid: trade.uuid,
            },
            {
              accountUuid: sellerAccounts.reserved.uuid,
              userUuid: sellerOrder.userUuid,
              entryType: "trade_matched",
              amount: sellerTradeCost,
              direction: "debit" as const,
              referenceType: "trade",
              referenceUuid: trade.uuid,
            },
            {
              accountUuid: platformAccounts.custody.uuid,
              entryType: "trade_matched",
              amount: buyerTradeCost.plus(sellerTradeCost),
              direction: "credit" as const,
              referenceType: "trade",
              referenceUuid: trade.uuid,
            },
          ];

          if (buyerReleaseAmount.gt(new Prisma.Decimal(0))) {
            tradeEntries.push(
              {
                accountUuid: buyerAccounts.reserved.uuid,
                userUuid: buyerOrder.userUuid,
                entryType: "trade_price_improved",
                amount: buyerReleaseAmount,
                direction: "debit" as const,
                referenceType: "trade",
                referenceUuid: trade.uuid,
              },
              {
                accountUuid: buyerAccounts.available.uuid,
                userUuid: buyerOrder.userUuid,
                entryType: "trade_price_improved",
                amount: buyerReleaseAmount,
                direction: "credit" as const,
                referenceType: "trade",
                referenceUuid: trade.uuid,
              },
            );
          }

          if (sellerReleaseAmount.gt(new Prisma.Decimal(0))) {
            tradeEntries.push(
              {
                accountUuid: sellerAccounts.reserved.uuid,
                userUuid: sellerOrder.userUuid,
                entryType: "trade_price_improved",
                amount: sellerReleaseAmount,
                direction: "debit" as const,
                referenceType: "trade",
                referenceUuid: trade.uuid,
              },
              {
                accountUuid: sellerAccounts.available.uuid,
                userUuid: sellerOrder.userUuid,
                entryType: "trade_price_improved",
                amount: sellerReleaseAmount,
                direction: "credit" as const,
                referenceType: "trade",
                referenceUuid: trade.uuid,
              },
            );
          }

          await this.ledgerService.postTransaction(
            {
              transactionType: "trade_match",
              referenceType: "trade",
              referenceUuid: trade.uuid,
              description: "Order matched",
              metadata: {
                marketUuid: input.marketUuid,
                buyOrderUuid: buyerOrder.uuid,
                sellOrderUuid: sellerOrder.uuid,
                price: tradePrice,
                quantity: tradeQuantity,
              },
              entries: tradeEntries,
            },
            {
              dbClient: tx,
              skipAuditLog: true,
            },
          );
        }

        return currentOrder;
      });

      await writeAuditLog({
        action: "orders.created",
        targetType: "order",
        targetUuid: order.uuid,
        payload: {
          marketUuid: order.marketUuid,
          side: order.side,
          outcome: order.outcome,
          price: order.price,
          quantity: order.quantity,
        },
      });

      await Promise.all([
        this.realtimePublisher.publishMarketBook(order.marketUuid),
        ...matchedTrades.map((trade) => this.realtimePublisher.publishTrade(trade)),
      ]);

      return mapOrder(order);
    } catch (error) {
      if (error instanceof LedgerError || error instanceof OrderError || error instanceof AccountStateError) {
        throw error;
      }

      throw error;
    }
  }

  async listOrders(input: ListOrdersInput): Promise<ListOrdersResult> {
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIST_LIMIT, 1), MAX_LIST_LIMIT);

    const items = await prisma.order.findMany({
      where: {
        userUuid: input.userUuid,
        marketUuid: input.marketUuid,
        status: input.status,
      },
      include: {
        market: {
          select: {
            uuid: true,
            slug: true,
            title: true,
            status: true,
            closeAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return {
      items: items.map(mapOrder),
      meta: {
        count: items.length,
        limit,
      },
    };
  }

  async cancelOrder(input: { userUuid: string; orderUuid: string }): Promise<OrderRecord> {
    const existingOrder = await prisma.order.findUnique({
      where: {
        uuid: input.orderUuid,
      },
      include: {
        market: {
          select: {
            uuid: true,
            slug: true,
            title: true,
            status: true,
            closeAt: true,
          },
        },
      },
    });

    if (!existingOrder) {
      throw new OrderError("Ordem nao encontrada.", 404);
    }

    if (existingOrder.userUuid !== input.userUuid) {
      throw new OrderError("Ordem nao encontrada.", 404);
    }

    if (!CANCELABLE_ORDER_STATUSES.includes(existingOrder.status as (typeof CANCELABLE_ORDER_STATUSES)[number])) {
      throw new OrderError("A ordem nao pode mais ser cancelada.", 400);
    }

    const canceledOrder = await prisma.$transaction(async (tx) => {
      const accounts = await this.ledgerService.ensureUserAccounts(
        {
          userUuid: input.userUuid,
        },
        tx,
      );
      const reserveAmount = this.calculateReserveAmount({
        side: existingOrder.side,
        price: existingOrder.price,
        quantity: existingOrder.remainingQuantity,
      });

      const updatedOrder = await tx.order.update({
        where: {
          uuid: existingOrder.uuid,
        },
        data: {
          status: "cancelled",
          canceledAt: new Date(),
        },
        include: {
          market: {
            select: {
              uuid: true,
              slug: true,
              title: true,
              status: true,
              closeAt: true,
            },
          },
        },
      });

      if (reserveAmount.gt(new Prisma.Decimal(0))) {
        await this.ledgerService.postTransaction(
          {
            transactionType: "order_release",
            referenceType: "order",
            referenceUuid: updatedOrder.uuid,
            description: "Order collateral released",
            metadata: {
              marketUuid: updatedOrder.marketUuid,
              side: updatedOrder.side,
              outcome: updatedOrder.outcome,
              price: updatedOrder.price,
              quantity: updatedOrder.remainingQuantity,
            },
            entries: [
              {
                accountUuid: accounts.reserved.uuid,
                userUuid: input.userUuid,
                entryType: "order_released",
                amount: reserveAmount,
                direction: "debit",
                referenceType: "order",
                referenceUuid: updatedOrder.uuid,
              },
              {
                accountUuid: accounts.available.uuid,
                userUuid: input.userUuid,
                entryType: "order_released",
                amount: reserveAmount,
                direction: "credit",
                referenceType: "order",
                referenceUuid: updatedOrder.uuid,
              },
            ],
          },
          {
            dbClient: tx,
            skipAuditLog: true,
          },
        );
      }

      return updatedOrder;
    });

    await writeAuditLog({
      action: "orders.cancelled",
      targetType: "order",
      targetUuid: canceledOrder.uuid,
      payload: {
        marketUuid: canceledOrder.marketUuid,
        status: canceledOrder.status,
      },
    });

    await this.realtimePublisher.publishMarketBook(canceledOrder.marketUuid);

    return mapOrder(canceledOrder);
  }

  private calculateReserveAmount(input: {
    side: string;
    price: number;
    quantity: number;
  }) {
    const centsPerContract = input.side === "buy" ? input.price : 100 - input.price;
    return new Prisma.Decimal(centsPerContract).mul(input.quantity).div(100);
  }

  private async applyTradeToPosition(input: {
    tx: Prisma.TransactionClient;
    userUuid: string;
    marketUuid: string;
    outcome: string;
    quantityDelta: number;
    executionPrice: number;
  }) {
    const existingPosition = await input.tx.position.findUnique({
      where: {
        userUuid_marketUuid_outcome: {
          userUuid: input.userUuid,
          marketUuid: input.marketUuid,
          outcome: input.outcome,
        },
      },
    });

    if (!existingPosition) {
      return input.tx.position.create({
        data: {
          userUuid: input.userUuid,
          marketUuid: input.marketUuid,
          outcome: input.outcome,
          netQuantity: input.quantityDelta,
          averageEntryPrice: new Prisma.Decimal(input.executionPrice),
          realizedPnl: ZERO_DECIMAL,
        },
      });
    }

    const currentNetQuantity = existingPosition.netQuantity;
    const nextNetQuantity = currentNetQuantity + input.quantityDelta;
    const currentPrice = new Prisma.Decimal(existingPosition.averageEntryPrice);
    const executionPrice = new Prisma.Decimal(input.executionPrice);
    let nextRealizedPnl = new Prisma.Decimal(existingPosition.realizedPnl);

    let nextAverageEntryPrice = currentPrice;

    if (currentNetQuantity !== 0 && Math.sign(currentNetQuantity) !== Math.sign(input.quantityDelta)) {
      const closingQuantity = Math.min(Math.abs(currentNetQuantity), Math.abs(input.quantityDelta));

      if (closingQuantity > 0) {
        const realizedPerContract =
          currentNetQuantity > 0 ? executionPrice.minus(currentPrice) : currentPrice.minus(executionPrice);
        const realizedDelta = realizedPerContract.mul(closingQuantity).div(CENTS_IN_DOLLAR);
        nextRealizedPnl = nextRealizedPnl.plus(realizedDelta);
      }
    }

    if (nextNetQuantity === 0) {
      nextAverageEntryPrice = ZERO_DECIMAL;
    } else if (currentNetQuantity === 0 || Math.sign(currentNetQuantity) !== Math.sign(input.quantityDelta)) {
      if (Math.sign(currentNetQuantity) !== Math.sign(nextNetQuantity) || currentNetQuantity === 0) {
        nextAverageEntryPrice = executionPrice;
      }
    } else {
      const weightedCurrent = currentPrice.mul(Math.abs(currentNetQuantity));
      const weightedTrade = executionPrice.mul(Math.abs(input.quantityDelta));
      nextAverageEntryPrice = weightedCurrent.plus(weightedTrade).div(Math.abs(nextNetQuantity));
    }

    return input.tx.position.update({
      where: {
        userUuid_marketUuid_outcome: {
          userUuid: input.userUuid,
          marketUuid: input.marketUuid,
          outcome: input.outcome,
        },
      },
      data: {
        netQuantity: nextNetQuantity,
        averageEntryPrice: nextAverageEntryPrice,
        realizedPnl: nextRealizedPnl,
      },
    });
  }
}
