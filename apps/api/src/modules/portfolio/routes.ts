import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getAuthenticatedUserUuid } from "../auth/authenticated-user.js";
import type { AuthServiceContract } from "../auth/service.js";
import { AuthError, AuthService } from "../auth/service.js";
import type { PortfolioServiceContract } from "./service.js";
import { PortfolioService } from "./service.js";

const listPositionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const handleRouteError = (error: unknown, reply: { code: (statusCode: number) => void }) => {
  if (error instanceof AuthError) {
    reply.code(error.statusCode);

    return {
      message: error.message,
    };
  }

  throw error;
};

export const buildPortfolioRoutes = (
  portfolioService: PortfolioServiceContract = new PortfolioService(),
  authService: AuthServiceContract = new AuthService(),
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.get("/portfolio/positions", async (request, reply) => {
      try {
        const query = listPositionsQuerySchema.parse(request.query);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);

        return {
          items: await portfolioService.listPositions({
            userUuid,
            limit: query.limit,
          }),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.get("/portfolio/pnl", async (request, reply) => {
      try {
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);

        return {
          summary: await portfolioService.getPnlSummary(userUuid),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.get("/portfolio/settlements", async (request, reply) => {
      try {
        const query = listPositionsQuerySchema.parse(request.query);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);

        return {
          items: await portfolioService.listSettlements({
            userUuid,
            limit: query.limit,
          }),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });
  };
};

export const portfolioRoutes = buildPortfolioRoutes();
