import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { MarketCatalogServiceContract } from "./public-service.js";
import { MarketCatalogError, MarketCatalogService } from "./public-service.js";

const listMarketsQuerySchema = z.object({
  status: z.string().trim().min(2).max(60).optional(),
  category: z.string().trim().min(2).max(120).optional(),
  closeAtFrom: z.coerce.date().optional(),
  closeAtTo: z.coerce.date().optional(),
});

const marketUuidParamSchema = z.object({
  marketUuid: z.string().uuid(),
});

const listTradesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
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

    fastify.get("/markets/:marketUuid/book", async (request, reply) => {
      try {
        const params = marketUuidParamSchema.parse(request.params);

        return {
          orderBook: await marketCatalogService.getOrderBook(params.marketUuid),
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

    fastify.get("/markets/:marketUuid/trades", async (request, reply) => {
      try {
        const params = marketUuidParamSchema.parse(request.params);
        const query = listTradesQuerySchema.parse(request.query);

        return {
          items: await marketCatalogService.getTrades(params.marketUuid, {
            limit: query.limit,
          }),
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
