import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { MarketCatalogServiceContract } from "./public-service.js";
import { MarketCatalogError, MarketCatalogService } from "./public-service.js";

const listMarketsQuerySchema = z.object({
  status: z.string().trim().min(2).max(60).optional(),
  category: z.string().trim().min(2).max(120).optional(),
});

const marketUuidParamSchema = z.object({
  marketUuid: z.string().uuid(),
});

export const buildMarketCatalogRoutes = (
  marketCatalogService: MarketCatalogServiceContract = new MarketCatalogService(),
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.get("/markets", async (request, reply) => {
      try {
        const query = listMarketsQuerySchema.parse(request.query);

        return {
          items: await marketCatalogService.listMarkets(query),
        };
      } catch (error) {
        if (error instanceof MarketCatalogError) {
          reply.code(error.statusCode);

          return {
            message: error.message,
          };
        }

        throw error;
      }
    });

    fastify.get("/markets/:marketUuid", async (request, reply) => {
      try {
        const params = marketUuidParamSchema.parse(request.params);

        return {
          market: await marketCatalogService.getMarket(params.marketUuid),
        };
      } catch (error) {
        if (error instanceof MarketCatalogError) {
          reply.code(error.statusCode);

          return {
            message: error.message,
          };
        }

        throw error;
      }
    });
  };
};

export const marketCatalogRoutes = buildMarketCatalogRoutes();
