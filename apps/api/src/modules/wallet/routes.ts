import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getAuthenticatedUserUuid } from "../auth/authenticated-user.js";
import type { AuthServiceContract } from "../auth/service.js";
import { AuthError, AuthService } from "../auth/service.js";
import type { WalletServiceContract } from "./service.js";
import { WalletService } from "./service.js";

const walletQuerySchema = z.object({
  currency: z.string().trim().min(3).max(3).optional(),
});

const statementQuerySchema = walletQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const buildWalletRoutes = (
  walletService: WalletServiceContract = new WalletService(),
  authService: AuthServiceContract = new AuthService(),
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.get("/wallet/balance", async (request, reply) => {
      try {
        const query = walletQuerySchema.parse(request.query);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);
        const balance = await walletService.getBalance(userUuid, query.currency);

        return {
          balance,
        };
      } catch (error) {
        if (error instanceof AuthError) {
          reply.code(error.statusCode);

          return {
            message: error.message,
          };
        }

        throw error;
      }
    });

    fastify.get("/wallet/entries", async (request, reply) => {
      try {
        const query = statementQuerySchema.parse(request.query);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);
        const statement = await walletService.getStatement({
          userUuid,
          currency: query.currency,
          limit: query.limit,
        });

        return statement;
      } catch (error) {
        if (error instanceof AuthError) {
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

export const walletRoutes = buildWalletRoutes();
