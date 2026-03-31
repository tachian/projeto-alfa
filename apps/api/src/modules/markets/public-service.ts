import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

const marketInclude = {
  rules: true,
} satisfies Prisma.MarketInclude;

export type PublicMarketRecord = {
  uuid: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  outcomeType: string;
  contractValue: string;
  tickSize: number;
  openAt: Date | null;
  closeAt: Date;
  createdAt: Date;
  updatedAt: Date;
  rules: {
    officialSourceLabel: string;
    officialSourceUrl: string;
    resolutionRules: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type ListPublicMarketsInput = {
  status?: string;
  category?: string;
  closeAtFrom?: Date;
  closeAtTo?: Date;
};

export type OrderBookLevel = {
  side: string;
  outcome: string;
  price: number;
  quantity: number;
  orderCount: number;
};

export type MarketOrderBookRecord = {
  marketUuid: string;
  marketStatus: string;
  levels: OrderBookLevel[];
};

export interface MarketCatalogServiceContract {
  listMarkets(input?: ListPublicMarketsInput): Promise<PublicMarketRecord[]>;
  getMarket(marketUuid: string): Promise<PublicMarketRecord>;
  getOrderBook(marketUuid: string): Promise<MarketOrderBookRecord>;
}

export class MarketCatalogError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "MarketCatalogError";
  }
}

const mapMarket = (market: Prisma.MarketGetPayload<{ include: typeof marketInclude }>): PublicMarketRecord => ({
  uuid: market.uuid,
  slug: market.slug,
  title: market.title,
  category: market.category,
  status: market.status,
  outcomeType: market.outcomeType,
  contractValue: market.contractValue.toFixed(2),
  tickSize: market.tickSize,
  openAt: market.openAt,
  closeAt: market.closeAt,
  createdAt: market.createdAt,
  updatedAt: market.updatedAt,
  rules: {
    officialSourceLabel: market.rules?.officialSourceLabel ?? "",
    officialSourceUrl: market.rules?.officialSourceUrl ?? "",
    resolutionRules: market.rules?.resolutionRules ?? "",
    createdAt: market.rules?.createdAt ?? market.createdAt,
    updatedAt: market.rules?.updatedAt ?? market.updatedAt,
  },
});

export class MarketCatalogService implements MarketCatalogServiceContract {
  async listMarkets(input: ListPublicMarketsInput = {}): Promise<PublicMarketRecord[]> {
    if (input.closeAtFrom && input.closeAtTo && input.closeAtFrom > input.closeAtTo) {
      throw new MarketCatalogError("A data inicial de vencimento deve ser anterior a data final.", 400);
    }

    const markets = await prisma.market.findMany({
      where: {
        status: input.status,
        category: input.category,
        closeAt: input.closeAtFrom || input.closeAtTo
          ? {
              gte: input.closeAtFrom,
              lte: input.closeAtTo,
            }
          : undefined,
      },
      include: marketInclude,
      orderBy: [
        {
          closeAt: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return markets.map(mapMarket);
  }

  async getMarket(marketUuid: string): Promise<PublicMarketRecord> {
    const market = await prisma.market.findUnique({
      where: {
        uuid: marketUuid,
      },
      include: marketInclude,
    });

    if (!market) {
      throw new MarketCatalogError("Mercado nao encontrado.", 404);
    }

    return mapMarket(market);
  }

  async getOrderBook(marketUuid: string): Promise<MarketOrderBookRecord> {
    const market = await prisma.market.findUnique({
      where: {
        uuid: marketUuid,
      },
      select: {
        uuid: true,
        status: true,
      },
    });

    if (!market) {
      throw new MarketCatalogError("Mercado nao encontrado.", 404);
    }

    const groupedLevels = await prisma.order.groupBy({
      by: ["side", "outcome", "price"],
      where: {
        marketUuid,
        status: {
          in: ["open", "partially_filled"],
        },
      },
      _sum: {
        remainingQuantity: true,
      },
      _count: {
        _all: true,
      },
      orderBy: [
        {
          price: "desc",
        },
      ],
    });

    return {
      marketUuid: market.uuid,
      marketStatus: market.status,
      levels: groupedLevels.map((level) => ({
        side: level.side,
        outcome: level.outcome,
        price: level.price,
        quantity: level._sum.remainingQuantity ?? 0,
        orderCount: level._count._all,
      })),
    };
  }
}
