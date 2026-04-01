import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AccountStateError } from "../account-state/service.js";
import type { AuthServiceContract } from "../auth/service.js";
import { AuthError, AuthService } from "../auth/service.js";
import { getAuthenticatedUserUuid } from "../auth/authenticated-user.js";
import type { PaymentServiceContract } from "./service.js";
import { PaymentError, PaymentService } from "./service.js";

const paymentBodySchema = z.object({
  amount: z.union([z.number(), z.string()]),
  currency: z.string().trim().min(3).max(3).optional(),
  description: z.string().trim().min(1).max(255).optional(),
});

const paymentListSchema = z.object({
  currency: z.string().trim().min(3).max(3).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const getIdempotencyKey = (headers: Record<string, string | string[] | undefined>) => {
  const header = headers["idempotency-key"];

  if (Array.isArray(header)) {
    return header[0];
  }

  return header;
};

export const buildPaymentRoutes = (
  paymentService: PaymentServiceContract = new PaymentService(),
  authService: AuthServiceContract = new AuthService(),
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.post("/payments/deposits", async (request, reply) => {
      try {
        const body = paymentBodySchema.parse(request.body);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);
        const payment = await paymentService.createDeposit({
          userUuid,
          amount: body.amount,
          currency: body.currency,
          description: body.description,
          idempotencyKey: getIdempotencyKey(request.headers as Record<string, string | string[] | undefined>),
        });

        reply.code(201);

        return {
          payment,
        };
      } catch (error) {
        if (error instanceof AuthError || error instanceof PaymentError || error instanceof AccountStateError) {
          reply.code(error.statusCode);

          return {
            message: error.message,
          };
        }

        throw error;
      }
    });

    fastify.get("/payments/deposits", async (request, reply) => {
      try {
        const query = paymentListSchema.parse(request.query);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);

        return await paymentService.listPayments({
          userUuid,
          type: "deposit",
          currency: query.currency,
          limit: query.limit,
        });
      } catch (error) {
        if (error instanceof AuthError || error instanceof PaymentError || error instanceof AccountStateError) {
          reply.code(error.statusCode);

          return {
            message: error.message,
          };
        }

        throw error;
      }
    });

    fastify.post("/payments/withdrawals", async (request, reply) => {
      try {
        const body = paymentBodySchema.parse(request.body);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);
        const payment = await paymentService.createWithdrawal({
          userUuid,
          amount: body.amount,
          currency: body.currency,
          description: body.description,
          idempotencyKey: getIdempotencyKey(request.headers as Record<string, string | string[] | undefined>),
        });

        reply.code(201);

        return {
          payment,
        };
      } catch (error) {
        if (error instanceof AuthError || error instanceof PaymentError || error instanceof AccountStateError) {
          reply.code(error.statusCode);

          return {
            message: error.message,
          };
        }

        throw error;
      }
    });

    fastify.get("/payments/withdrawals", async (request, reply) => {
      try {
        const query = paymentListSchema.parse(request.query);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);

        return await paymentService.listPayments({
          userUuid,
          type: "withdrawal",
          currency: query.currency,
          limit: query.limit,
        });
      } catch (error) {
        if (error instanceof AuthError || error instanceof PaymentError || error instanceof AccountStateError) {
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

export const paymentRoutes = buildPaymentRoutes();
