import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { recordBusinessOperationMetric } from "../../lib/metrics.js";
import { LedgerService } from "../ledger/service.js";
import { writeAuditLog } from "../../lib/audit.js";

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
  createdByUserUuid?: string | null;
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
  updatedByUserUuid?: string | null;
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
  executeSettlementRun(input: { settlementRunUuid: string; executedByUserUuid?: string | null }): Promise<SettlementRunRecord>;
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
  constructor(
    private readonly ledgerService = new LedgerService(),
  ) {}

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

      await writeAuditLog({
        action: "settlement.resolution.created",
        targetType: "market_resolution",
        targetUuid: resolution.uuid,
        actorUuid: input.resolvedByUserUuid ?? undefined,
        payload: {
          marketUuid: resolution.marketUuid,
          status: resolution.status,
          winningOutcome: resolution.winningOutcome,
        },
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

      await writeAuditLog({
        action: "settlement.run.created",
        targetType: "settlement_run",
        targetUuid: run.uuid,
        actorUuid: input.createdByUserUuid ?? undefined,
        payload: {
          marketUuid: run.marketUuid,
          marketResolutionUuid: run.marketResolutionUuid,
          status: run.status,
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

    await writeAuditLog({
      action: "settlement.run.updated",
      targetType: "settlement_run",
      targetUuid: run.uuid,
      actorUuid: input.updatedByUserUuid ?? undefined,
      payload: {
        previousStatus: existingRun.status,
        status: run.status,
        contractsProcessed: run.contractsProcessed,
        totalPayout: run.totalPayout.toFixed(4),
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

  async executeSettlementRun(input: {
    settlementRunUuid: string;
    executedByUserUuid?: string | null;
  }): Promise<SettlementRunRecord> {
    const run = await prisma.settlementRun.findUnique({
      where: {
        uuid: input.settlementRunUuid,
      },
      include: {
        market: {
          select: {
            uuid: true,
            contractValue: true,
          },
        },
        marketResolution: {
          select: {
            uuid: true,
            status: true,
            winningOutcome: true,
          },
        },
      },
    });

    if (!run) {
      throw new SettlementError("Settlement run nao encontrado.", 404);
    }

    if (run.marketResolution.status !== "resolved" || !run.marketResolution.winningOutcome) {
      throw new SettlementError("A resolucao precisa estar marcada como resolved com resultado vencedor.", 400);
    }

    const winningOutcome = run.marketResolution.winningOutcome;
    const contractValue = new Prisma.Decimal(run.market.contractValue);
    const settlementPriceForWinningOutcome = contractValue.mul(100);

    const settledRun = await prisma.$transaction(async (tx) => {
      const platformAccounts = await this.ledgerService.ensurePlatformAccounts(undefined, tx);
      const positions = await tx.position.findMany({
        where: {
          marketUuid: run.marketUuid,
          netQuantity: {
            not: 0,
          },
        },
      });

      let totalPayout = new Prisma.Decimal(0);

      for (const position of positions) {
        const quantity = Math.abs(position.netQuantity);
        const averageEntryPrice = new Prisma.Decimal(position.averageEntryPrice);
        const realizedPnl = new Prisma.Decimal(position.realizedPnl);
        const contractSettlesAt = position.outcome === winningOutcome ? settlementPriceForWinningOutcome : new Prisma.Decimal(0);
        const settlementPnl =
          position.netQuantity > 0
            ? contractSettlesAt.minus(averageEntryPrice).mul(quantity).div(100)
            : averageEntryPrice.minus(contractSettlesAt).mul(quantity).div(100);
        const nextRealizedPnl = realizedPnl.plus(settlementPnl);
        const isWinningPosition =
          (position.netQuantity > 0 && position.outcome === winningOutcome) ||
          (position.netQuantity < 0 && position.outcome !== winningOutcome);
        const payoutAmount = isWinningPosition ? contractValue.mul(quantity) : new Prisma.Decimal(0);
        const positionDirection = position.netQuantity > 0 ? "long" : "short";
        const settlementStatus = isWinningPosition ? "won" : "lost";

        if (isWinningPosition) {
          const userAccounts = await this.ledgerService.ensureUserAccounts(
            {
              userUuid: position.userUuid,
            },
            tx,
          );

          await this.ledgerService.postTransaction(
            {
              transactionType: "market_settlement_payout",
              referenceType: "settlement_run",
              referenceUuid: run.uuid,
              description: "Market settlement payout",
              metadata: {
                marketUuid: run.marketUuid,
                marketResolutionUuid: run.marketResolutionUuid,
                winningOutcome,
                positionUuid: position.uuid,
                outcome: position.outcome,
                quantity,
              },
              entries: [
                {
                  accountUuid: platformAccounts.custody.uuid,
                  entryType: "market_settlement",
                  amount: payoutAmount,
                  direction: "debit",
                  referenceType: "settlement_run",
                  referenceUuid: run.uuid,
                },
                {
                  accountUuid: userAccounts.available.uuid,
                  userUuid: position.userUuid,
                  entryType: "market_settlement",
                  amount: payoutAmount,
                  direction: "credit",
                  referenceType: "settlement_run",
                  referenceUuid: run.uuid,
                },
              ],
            },
            {
              dbClient: tx,
              skipAuditLog: true,
            },
          );

          totalPayout = totalPayout.plus(payoutAmount);
        }

        await tx.positionSettlement.create({
          data: {
            settlementRunUuid: run.uuid,
            positionUuid: position.uuid,
            userUuid: position.userUuid,
            marketUuid: position.marketUuid,
            outcome: position.outcome,
            winningOutcome,
            positionDirection,
            contractsSettled: quantity,
            payoutAmount,
            realizedPnlDelta: settlementPnl,
            status: settlementStatus,
          },
        });

        await tx.position.update({
          where: {
            uuid: position.uuid,
          },
          data: {
            netQuantity: 0,
            averageEntryPrice: new Prisma.Decimal(0),
            realizedPnl: nextRealizedPnl,
          },
        });
      }

      return tx.settlementRun.update({
        where: {
          uuid: run.uuid,
        },
        data: {
          status: "completed",
          contractsProcessed: positions.reduce((total, position) => total + Math.abs(position.netQuantity), 0),
          totalPayout,
          metadata: {
            ...(run.metadata && typeof run.metadata === "object" && !Array.isArray(run.metadata) ? run.metadata : {}),
            executedByUserUuid: input.executedByUserUuid ?? null,
            winningOutcome,
          },
          finishedAt: new Date(),
        },
      });
    });

    await writeAuditLog({
      action: "settlement.run.executed",
      targetType: "settlement_run",
      targetUuid: settledRun.uuid,
      actorUuid: input.executedByUserUuid ?? undefined,
      payload: {
        marketUuid: settledRun.marketUuid,
        contractsProcessed: settledRun.contractsProcessed,
        totalPayout: settledRun.totalPayout.toFixed(4),
      },
    });

    recordBusinessOperationMetric({
      operation: "settlement_execute",
      status: "success",
    });

    return mapSettlementRun(settledRun);
  }
}
