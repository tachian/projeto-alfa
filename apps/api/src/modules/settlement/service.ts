import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export type MarketResolutionRecord = {
  uuid: string;
  marketUuid: string;
  winningOutcome: string | null;
  sourceValue: string | null;
  status: string;
  notes: string | null;
  resolvedByUserUuid: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SettlementRunRecord = {
  uuid: string;
  marketUuid: string;
  marketResolutionUuid: string;
  status: string;
  contractsProcessed: number;
  totalPayout: string;
  metadata: Prisma.JsonValue | null;
  startedAt: Date;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMarketResolutionInput = {
  marketUuid: string;
  winningOutcome?: string | null;
  sourceValue?: string | null;
  status: string;
  notes?: string | null;
  resolvedByUserUuid?: string | null;
  resolvedAt?: Date | null;
};

export type CreateSettlementRunInput = {
  marketUuid: string;
  marketResolutionUuid: string;
  status?: string;
  contractsProcessed?: number;
  totalPayout?: Prisma.Decimal | number | string;
  metadata?: Prisma.InputJsonValue;
  startedAt?: Date;
  finishedAt?: Date | null;
};

export type UpdateSettlementRunInput = {
  settlementRunUuid: string;
  status?: string;
  contractsProcessed?: number;
  totalPayout?: Prisma.Decimal | number | string;
  metadata?: Prisma.InputJsonValue;
  finishedAt?: Date | null;
};

export interface SettlementServiceContract {
  createMarketResolution(input: CreateMarketResolutionInput): Promise<MarketResolutionRecord>;
  listMarketResolutions(marketUuid: string): Promise<MarketResolutionRecord[]>;
  createSettlementRun(input: CreateSettlementRunInput): Promise<SettlementRunRecord>;
  updateSettlementRun(input: UpdateSettlementRunInput): Promise<SettlementRunRecord>;
  listSettlementRuns(marketUuid: string): Promise<SettlementRunRecord[]>;
}

export class SettlementError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "SettlementError";
  }
}

const isForeignKeyViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";

const resolutionStatusToMarketStatus = (status: string) => {
  if (status === "resolved") {
    return "resolved";
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  return "resolving";
};

const toDecimal = (value: Prisma.Decimal | number | string | undefined, fallback: string) => {
  if (value === undefined) {
    return new Prisma.Decimal(fallback);
  }

  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
};

const mapMarketResolution = (resolution: {
  uuid: string;
  marketUuid: string;
  winningOutcome: string | null;
  sourceValue: string | null;
  status: string;
  notes: string | null;
  resolvedByUserUuid: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): MarketResolutionRecord => ({
  uuid: resolution.uuid,
  marketUuid: resolution.marketUuid,
  winningOutcome: resolution.winningOutcome,
  sourceValue: resolution.sourceValue,
  status: resolution.status,
  notes: resolution.notes,
  resolvedByUserUuid: resolution.resolvedByUserUuid,
  resolvedAt: resolution.resolvedAt,
  createdAt: resolution.createdAt,
  updatedAt: resolution.updatedAt,
});

const mapSettlementRun = (run: {
  uuid: string;
  marketUuid: string;
  marketResolutionUuid: string;
  status: string;
  contractsProcessed: number;
  totalPayout: Prisma.Decimal;
  metadata: Prisma.JsonValue | null;
  startedAt: Date;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SettlementRunRecord => ({
  uuid: run.uuid,
  marketUuid: run.marketUuid,
  marketResolutionUuid: run.marketResolutionUuid,
  status: run.status,
  contractsProcessed: run.contractsProcessed,
  totalPayout: run.totalPayout.toFixed(4),
  metadata: run.metadata,
  startedAt: run.startedAt,
  finishedAt: run.finishedAt,
  createdAt: run.createdAt,
  updatedAt: run.updatedAt,
});

export class SettlementService implements SettlementServiceContract {
  async createMarketResolution(input: CreateMarketResolutionInput): Promise<MarketResolutionRecord> {
    try {
      const resolution = await prisma.$transaction(async (tx) => {
        const market = await tx.market.findUnique({
          where: {
            uuid: input.marketUuid,
          },
          select: {
            uuid: true,
          },
        });

        if (!market) {
          throw new SettlementError("Mercado nao encontrado para resolucao.", 404);
        }

        const createdResolution = await tx.marketResolution.create({
          data: {
            marketUuid: input.marketUuid,
            winningOutcome: input.winningOutcome ?? null,
            sourceValue: input.sourceValue ?? null,
            status: input.status,
            notes: input.notes ?? null,
            resolvedByUserUuid: input.resolvedByUserUuid ?? null,
            resolvedAt: input.resolvedAt ?? null,
          },
        });

        await tx.market.update({
          where: {
            uuid: input.marketUuid,
          },
          data: {
            status: resolutionStatusToMarketStatus(input.status),
          },
        });

        return createdResolution;
      });

      return mapMarketResolution(resolution);
    } catch (error) {
      if (error instanceof SettlementError) {
        throw error;
      }

      if (isForeignKeyViolation(error)) {
        throw new SettlementError("Mercado nao encontrado para resolucao.", 404);
      }

      throw error;
    }
  }

  async listMarketResolutions(marketUuid: string): Promise<MarketResolutionRecord[]> {
    const resolutions = await prisma.marketResolution.findMany({
      where: {
        marketUuid,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return resolutions.map(mapMarketResolution);
  }

  async createSettlementRun(input: CreateSettlementRunInput): Promise<SettlementRunRecord> {
    try {
      const run = await prisma.settlementRun.create({
        data: {
          marketUuid: input.marketUuid,
          marketResolutionUuid: input.marketResolutionUuid,
          status: input.status ?? "pending",
          contractsProcessed: input.contractsProcessed ?? 0,
          totalPayout: toDecimal(input.totalPayout, "0"),
          metadata: input.metadata,
          startedAt: input.startedAt ?? new Date(),
          finishedAt: input.finishedAt ?? null,
        },
      });

      return mapSettlementRun(run);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new SettlementError("Resolucao ou mercado nao encontrado para liquidacao.", 404);
      }

      throw error;
    }
  }

  async updateSettlementRun(input: UpdateSettlementRunInput): Promise<SettlementRunRecord> {
    const existingRun = await prisma.settlementRun.findUnique({
      where: {
        uuid: input.settlementRunUuid,
      },
    });

    if (!existingRun) {
      throw new SettlementError("Settlement run nao encontrado.", 404);
    }

    const run = await prisma.settlementRun.update({
      where: {
        uuid: input.settlementRunUuid,
      },
      data: {
        status: input.status,
        contractsProcessed: input.contractsProcessed,
        totalPayout:
          input.totalPayout === undefined ? undefined : toDecimal(input.totalPayout, existingRun.totalPayout.toString()),
        metadata: input.metadata,
        finishedAt: input.finishedAt,
      },
    });

    return mapSettlementRun(run);
  }

  async listSettlementRuns(marketUuid: string): Promise<SettlementRunRecord[]> {
    const runs = await prisma.settlementRun.findMany({
      where: {
        marketUuid,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return runs.map(mapSettlementRun);
  }
}
