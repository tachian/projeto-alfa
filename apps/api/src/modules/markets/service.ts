import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { MARKET_OUTCOME_TYPES, MARKET_STATUSES } from "./constants.js";

const marketInclude = {
  rules: true,
} satisfies Prisma.MarketInclude;

export type MarketAdminRecord = {
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

export type CreateMarketInput = {
  slug: string;
  title: string;
  category: string;
  status: string;
  outcomeType?: string;
  contractValue?: Prisma.Decimal | number | string;
  tickSize?: number;
  openAt?: Date | null;
  closeAt: Date;
  officialSourceLabel: string;
  officialSourceUrl: string;
  resolutionRules: string;
};

export type UpdateMarketInput = Partial<CreateMarketInput> & {
  marketUuid: string;
};

export interface MarketAdminServiceContract {
  createMarket(input: CreateMarketInput): Promise<MarketAdminRecord>;
  listMarkets(): Promise<MarketAdminRecord[]>;
  getMarket(marketUuid: string): Promise<MarketAdminRecord>;
  updateMarket(input: UpdateMarketInput): Promise<MarketAdminRecord>;
  deleteMarket(marketUuid: string): Promise<void>;
}

export class MarketAdminError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "MarketAdminError";
  }
}

const toDecimal = (value: Prisma.Decimal | number | string | undefined, fallback: string) => {
  if (value === undefined) {
    return new Prisma.Decimal(fallback);
  }

  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
};

const assertStatus = (status: string | undefined) => {
  if (status && !MARKET_STATUSES.includes(status as (typeof MARKET_STATUSES)[number])) {
    throw new MarketAdminError("Estado de mercado invalido.", 400);
  }
};

const assertOutcomeType = (outcomeType: string | undefined) => {
  if (outcomeType && !MARKET_OUTCOME_TYPES.includes(outcomeType as (typeof MARKET_OUTCOME_TYPES)[number])) {
    throw new MarketAdminError("Tipo de resultado invalido.", 400);
  }
};

const mapMarket = (market: Prisma.MarketGetPayload<{ include: typeof marketInclude }>): MarketAdminRecord => ({
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

const assertChronology = (input: {
  openAt?: Date | null;
  closeAt?: Date;
}) => {
  if (input.openAt && input.closeAt && input.openAt >= input.closeAt) {
    throw new MarketAdminError("A data de abertura deve ser anterior ao fechamento.", 400);
  }
};

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export class MarketAdminService implements MarketAdminServiceContract {
  async createMarket(input: CreateMarketInput): Promise<MarketAdminRecord> {
    assertStatus(input.status);
    assertOutcomeType(input.outcomeType);
    assertChronology({
      openAt: input.openAt,
      closeAt: input.closeAt,
    });

    try {
      const market = await prisma.market.create({
        data: {
          slug: input.slug,
          title: input.title,
          category: input.category,
          status: input.status,
          outcomeType: input.outcomeType ?? "binary",
          contractValue: toDecimal(input.contractValue, "1"),
          tickSize: input.tickSize ?? 1,
          openAt: input.openAt ?? null,
          closeAt: input.closeAt,
          rules: {
            create: {
              officialSourceLabel: input.officialSourceLabel,
              officialSourceUrl: input.officialSourceUrl,
              resolutionRules: input.resolutionRules,
            },
          },
        },
        include: marketInclude,
      });

      await writeAuditLog({
        action: "markets.admin.created",
        targetType: "market",
        targetUuid: market.uuid,
        payload: {
          slug: market.slug,
          status: market.status,
        },
      });

      return mapMarket(market);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new MarketAdminError("Ja existe um mercado com esse slug.", 409);
      }

      throw error;
    }
  }

  async listMarkets(): Promise<MarketAdminRecord[]> {
    const markets = await prisma.market.findMany({
      include: marketInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return markets.map(mapMarket);
  }

  async getMarket(marketUuid: string): Promise<MarketAdminRecord> {
    const market = await prisma.market.findUnique({
      where: {
        uuid: marketUuid,
      },
      include: marketInclude,
    });

    if (!market) {
      throw new MarketAdminError("Mercado nao encontrado.", 404);
    }

    return mapMarket(market);
  }

  async updateMarket(input: UpdateMarketInput): Promise<MarketAdminRecord> {
    const existingMarket = await prisma.market.findUnique({
      where: {
        uuid: input.marketUuid,
      },
      include: marketInclude,
    });

    if (!existingMarket) {
      throw new MarketAdminError("Mercado nao encontrado.", 404);
    }

    assertStatus(input.status);
    assertOutcomeType(input.outcomeType);
    const nextOpenAt = input.openAt === undefined ? existingMarket.openAt : input.openAt;
    const nextCloseAt = input.closeAt ?? existingMarket.closeAt;

    assertChronology({
      openAt: nextOpenAt,
      closeAt: nextCloseAt,
    });

    try {
      const market = await prisma.market.update({
        where: {
          uuid: input.marketUuid,
        },
        data: {
          slug: input.slug,
          title: input.title,
          category: input.category,
          status: input.status,
          outcomeType: input.outcomeType,
          contractValue:
            input.contractValue === undefined
              ? undefined
              : toDecimal(input.contractValue, existingMarket.contractValue.toString()),
          tickSize: input.tickSize,
          openAt: nextOpenAt,
          closeAt: nextCloseAt,
          rules: input.officialSourceLabel || input.officialSourceUrl || input.resolutionRules
            ? {
                upsert: {
                  create: {
                    officialSourceLabel:
                      input.officialSourceLabel ?? existingMarket.rules?.officialSourceLabel ?? "",
                    officialSourceUrl:
                      input.officialSourceUrl ?? existingMarket.rules?.officialSourceUrl ?? "",
                    resolutionRules:
                      input.resolutionRules ?? existingMarket.rules?.resolutionRules ?? "",
                  },
                  update: {
                    officialSourceLabel: input.officialSourceLabel,
                    officialSourceUrl: input.officialSourceUrl,
                    resolutionRules: input.resolutionRules,
                  },
                },
              }
            : undefined,
        },
        include: marketInclude,
      });

      await writeAuditLog({
        action: "markets.admin.updated",
        targetType: "market",
        targetUuid: market.uuid,
        payload: {
          slug: market.slug,
          status: market.status,
        },
      });

      return mapMarket(market);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new MarketAdminError("Ja existe um mercado com esse slug.", 409);
      }

      throw error;
    }
  }

  async deleteMarket(marketUuid: string): Promise<void> {
    try {
      await prisma.market.delete({
        where: {
          uuid: marketUuid,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new MarketAdminError("Mercado nao encontrado.", 404);
      }

      throw error;
    }

    await writeAuditLog({
      action: "markets.admin.deleted",
      targetType: "market",
      targetUuid: marketUuid,
    });
  }
}
