import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

const DEFAULT_POSITION_LIMIT = 100;
const CENTS_IN_DOLLAR = new Prisma.Decimal(100);

export type PortfolioPositionRecord = {
  uuid: string;
  userUuid: string;
  marketUuid: string;
  outcome: string;
  netQuantity: number;
  averageEntryPrice: string;
  markPrice: string;
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  market: {
    uuid: string;
    slug: string;
    title: string;
    status: string;
    closeAt: Date;
  };
  updatedAt: Date;
};

export type PortfolioPnlSummary = {
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  openPositions: number;
};

export interface PortfolioServiceContract {
  listPositions(input: { userUuid: string; limit?: number }): Promise<PortfolioPositionRecord[]>;
  getPnlSummary(userUuid: string): Promise<PortfolioPnlSummary>;
}

const toMoneyString = (value: Prisma.Decimal) => value.toFixed(4);

export class PortfolioService implements PortfolioServiceContract {
  async listPositions(input: { userUuid: string; limit?: number }): Promise<PortfolioPositionRecord[]> {
    const positions = await prisma.position.findMany({
      where: {
        userUuid: input.userUuid,
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
        updatedAt: "desc",
      },
      take: input.limit ?? DEFAULT_POSITION_LIMIT,
    });

    const latestTrades = await prisma.trade.findMany({
      where: {
        marketUuid: {
          in: Array.from(new Set(positions.map((position) => position.marketUuid))),
        },
      },
      orderBy: {
        executedAt: "desc",
      },
    });

    const latestTradeByMarket = new Map<string, (typeof latestTrades)[number]>();

    for (const trade of latestTrades) {
      if (!latestTradeByMarket.has(trade.marketUuid)) {
        latestTradeByMarket.set(trade.marketUuid, trade);
      }
    }

    return positions.map((position) => {
      const averageEntryPrice = new Prisma.Decimal(position.averageEntryPrice);
      const realizedPnl = new Prisma.Decimal(position.realizedPnl);
      const latestTrade = latestTradeByMarket.get(position.marketUuid);
      const markPrice = latestTrade ? new Prisma.Decimal(latestTrade.price) : averageEntryPrice;
      const unrealizedPnl = markPrice
        .minus(averageEntryPrice)
        .mul(position.netQuantity)
        .div(CENTS_IN_DOLLAR);
      const totalPnl = realizedPnl.plus(unrealizedPnl);

      return {
        uuid: position.uuid,
        userUuid: position.userUuid,
        marketUuid: position.marketUuid,
        outcome: position.outcome,
        netQuantity: position.netQuantity,
        averageEntryPrice: averageEntryPrice.toFixed(4),
        markPrice: markPrice.toFixed(4),
        realizedPnl: toMoneyString(realizedPnl),
        unrealizedPnl: toMoneyString(unrealizedPnl),
        totalPnl: toMoneyString(totalPnl),
        market: position.market,
        updatedAt: position.updatedAt,
      };
    });
  }

  async getPnlSummary(userUuid: string): Promise<PortfolioPnlSummary> {
    const positions = await this.listPositions({ userUuid });

    const totals = positions.reduce(
      (accumulator, position) => ({
        realizedPnl: accumulator.realizedPnl.plus(position.realizedPnl),
        unrealizedPnl: accumulator.unrealizedPnl.plus(position.unrealizedPnl),
      }),
      {
        realizedPnl: ZERO_DECIMAL,
        unrealizedPnl: ZERO_DECIMAL,
      },
    );

    return {
      realizedPnl: toMoneyString(totals.realizedPnl),
      unrealizedPnl: toMoneyString(totals.unrealizedPnl),
      totalPnl: toMoneyString(totals.realizedPnl.plus(totals.unrealizedPnl)),
      openPositions: positions.filter((position) => position.netQuantity !== 0).length,
    };
  }
}

const ZERO_DECIMAL = new Prisma.Decimal(0);
