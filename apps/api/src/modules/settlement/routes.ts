import type { Prisma } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireAdminUser } from "../auth/authenticated-user.js";
import type { AuthServiceContract } from "../auth/service.js";
import { AuthError, AuthService } from "../auth/service.js";
import type { SettlementServiceContract } from "./service.js";
import { SettlementError, SettlementService } from "./service.js";

const RESOLUTION_STATUSES = ["pending", "confirmed", "resolved", "cancelled"] as const;
const SETTLEMENT_RUN_STATUSES = ["pending", "running", "completed", "failed"] as const;

const marketUuidParamSchema = z.object({
  marketUuid: z.string().uuid(),
});

const settlementRunUuidParamSchema = z.object({
  settlementRunUuid: z.string().uuid(),
});

const createResolutionSchema = z.object({
  winningOutcome: z.enum(["YES", "NO"]).nullable().optional(),
  sourceValue: z.string().trim().min(1).max(5000).nullable().optional(),
  status: z.enum(RESOLUTION_STATUSES),
  notes: z.string().trim().max(5000).nullable().optional(),
  resolvedAt: z.coerce.date().nullable().optional(),
});

const createSettlementRunSchema = z.object({
  marketResolutionUuid: z.string().uuid(),
  status: z.enum(SETTLEMENT_RUN_STATUSES).optional(),
  contractsProcessed: z.number().int().min(0).optional(),
  totalPayout: z.union([z.number(), z.string()]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  startedAt: z.coerce.date().optional(),
  finishedAt: z.coerce.date().nullable().optional(),
});

const updateSettlementRunSchema = z.object({
  status: z.enum(SETTLEMENT_RUN_STATUSES).optional(),
  contractsProcessed: z.number().int().min(0).optional(),
  totalPayout: z.union([z.number(), z.string()]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  finishedAt: z.coerce.date().nullable().optional(),
});

const handleRouteError = (error: unknown, reply: { code: (statusCode: number) => void }) => {
  if (error instanceof AuthError || error instanceof SettlementError) {
    reply.code(error.statusCode);

    return {
      message: error.message,
    };
  }

  throw error;
};

export const buildSettlementRoutes = (
  settlementService: SettlementServiceContract = new SettlementService(),
  authService: AuthServiceContract = new AuthService(),
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.get("/admin/markets/:marketUuid/resolutions", async (request, reply) => {
      try {
        await requireAdminUser(request.headers.authorization, authService);
        const params = marketUuidParamSchema.parse(request.params);

        return {
          items: await settlementService.listMarketResolutions(params.marketUuid),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.post("/admin/markets/:marketUuid/resolutions", async (request, reply) => {
      try {
        const adminUser = await requireAdminUser(request.headers.authorization, authService);
        const params = marketUuidParamSchema.parse(request.params);
        const body = createResolutionSchema.parse(request.body);
        const resolution = await settlementService.createMarketResolution({
          marketUuid: params.marketUuid,
          winningOutcome: body.winningOutcome,
          sourceValue: body.sourceValue,
          status: body.status,
          notes: body.notes,
          resolvedAt: body.resolvedAt,
          resolvedByUserUuid: adminUser.uuid,
        });

        reply.code(201);

        return {
          resolution,
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.get("/admin/markets/:marketUuid/settlement-runs", async (request, reply) => {
      try {
        await requireAdminUser(request.headers.authorization, authService);
        const params = marketUuidParamSchema.parse(request.params);

        return {
          items: await settlementService.listSettlementRuns(params.marketUuid),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.post("/admin/markets/:marketUuid/settlement-runs", async (request, reply) => {
      try {
        const adminUser = await requireAdminUser(request.headers.authorization, authService);
        const params = marketUuidParamSchema.parse(request.params);
        const body = createSettlementRunSchema.parse(request.body);
        const settlementRun = await settlementService.createSettlementRun({
          createdByUserUuid: adminUser.uuid,
          marketUuid: params.marketUuid,
          marketResolutionUuid: body.marketResolutionUuid,
          status: body.status,
          contractsProcessed: body.contractsProcessed,
          totalPayout: body.totalPayout,
          metadata: body.metadata as Prisma.InputJsonValue | undefined,
          startedAt: body.startedAt,
          finishedAt: body.finishedAt,
        });

        reply.code(201);

        return {
          settlementRun,
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.patch("/admin/settlement-runs/:settlementRunUuid", async (request, reply) => {
      try {
        const adminUser = await requireAdminUser(request.headers.authorization, authService);
        const params = settlementRunUuidParamSchema.parse(request.params);
        const body = updateSettlementRunSchema.parse(request.body);

        return {
          settlementRun: await settlementService.updateSettlementRun({
            settlementRunUuid: params.settlementRunUuid,
            updatedByUserUuid: adminUser.uuid,
            status: body.status,
            contractsProcessed: body.contractsProcessed,
            totalPayout: body.totalPayout,
            metadata: body.metadata as Prisma.InputJsonValue | undefined,
            finishedAt: body.finishedAt,
          }),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.post("/admin/settlement-runs/:settlementRunUuid/execute", async (request, reply) => {
      try {
        const adminUser = await requireAdminUser(request.headers.authorization, authService);
        const params = settlementRunUuidParamSchema.parse(request.params);

        return {
          settlementRun: await settlementService.executeSettlementRun({
            settlementRunUuid: params.settlementRunUuid,
            executedByUserUuid: adminUser.uuid,
          }),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });
  };
};

export const settlementRoutes = buildSettlementRoutes();
