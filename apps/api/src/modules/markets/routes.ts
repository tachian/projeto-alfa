import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getAuthenticatedUserUuid } from "../auth/authenticated-user.js";
import type { AuthServiceContract } from "../auth/service.js";
import { AuthError, AuthService } from "../auth/service.js";
import { MARKET_OUTCOME_TYPES, MARKET_STATUSES } from "./constants.js";
import type { MarketAdminServiceContract } from "./service.js";
import { MarketAdminError, MarketAdminService } from "./service.js";

const marketUuidParamSchema = z.object({
  marketUuid: z.string().uuid(),
});

const createMarketSchema = z.object({
  slug: z.string().trim().min(3).max(120),
  title: z.string().trim().min(3).max(255),
  category: z.string().trim().min(2).max(120),
  status: z.enum(MARKET_STATUSES),
  outcomeType: z.enum(MARKET_OUTCOME_TYPES).optional(),
  contractValue: z.union([z.number(), z.string()]).optional(),
  tickSize: z.number().int().positive().optional(),
  openAt: z.coerce.date().nullable().optional(),
  closeAt: z.coerce.date(),
  officialSourceLabel: z.string().trim().min(3).max(255),
  officialSourceUrl: z.string().trim().url().max(2048),
  resolutionRules: z.string().trim().min(3).max(5000),
});

const updateMarketSchema = createMarketSchema.partial();

const handleRouteError = (error: unknown, reply: { code: (statusCode: number) => void }) => {
  if (error instanceof AuthError || error instanceof MarketAdminError) {
    reply.code(error.statusCode);

    return {
      message: error.message,
    };
  }

  throw error;
};

export const buildMarketAdminRoutes = (
  marketAdminService: MarketAdminServiceContract = new MarketAdminService(),
  authService: AuthServiceContract = new AuthService(),
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.get("/admin/markets", async (request, reply) => {
      try {
        await getAuthenticatedUserUuid(request.headers.authorization, authService);

        return {
          items: await marketAdminService.listMarkets(),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.get("/admin/markets/:marketUuid", async (request, reply) => {
      try {
        await getAuthenticatedUserUuid(request.headers.authorization, authService);
        const params = marketUuidParamSchema.parse(request.params);

        return {
          market: await marketAdminService.getMarket(params.marketUuid),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.post("/admin/markets", async (request, reply) => {
      try {
        await getAuthenticatedUserUuid(request.headers.authorization, authService);
        const body = createMarketSchema.parse(request.body);
        const market = await marketAdminService.createMarket(body);

        reply.code(201);

        return {
          market,
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.patch("/admin/markets/:marketUuid", async (request, reply) => {
      try {
        await getAuthenticatedUserUuid(request.headers.authorization, authService);
        const params = marketUuidParamSchema.parse(request.params);
        const body = updateMarketSchema.parse(request.body);

        return {
          market: await marketAdminService.updateMarket({
            marketUuid: params.marketUuid,
            ...body,
          }),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.delete("/admin/markets/:marketUuid", async (request, reply) => {
      try {
        await getAuthenticatedUserUuid(request.headers.authorization, authService);
        const params = marketUuidParamSchema.parse(request.params);
        await marketAdminService.deleteMarket(params.marketUuid);

        reply.code(204);

        return null;
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });
  };
};

export const marketAdminRoutes = buildMarketAdminRoutes();
