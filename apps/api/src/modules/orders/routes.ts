import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getAuthenticatedUserUuid } from "../auth/authenticated-user.js";
import type { AuthServiceContract } from "../auth/service.js";
import { AuthError, AuthService } from "../auth/service.js";
import type { OrderServiceContract } from "./service.js";
import { OrderError, OrderService } from "./service.js";

const createOrderSchema = z.object({
  marketUuid: z.string().uuid(),
  side: z.enum(["buy", "sell"]),
  outcome: z.enum(["YES", "NO"]),
  orderType: z.enum(["limit"]).optional(),
  price: z.number().int().min(1).max(99),
  quantity: z.number().int().min(1),
});

const listOrdersSchema = z.object({
  marketUuid: z.string().uuid().optional(),
  status: z.string().trim().min(2).max(60).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const cancelOrderParamsSchema = z.object({
  orderUuid: z.string().uuid(),
});

const handleRouteError = (error: unknown, reply: { code: (statusCode: number) => void }) => {
  if (error instanceof AuthError || error instanceof OrderError) {
    reply.code(error.statusCode);

    return {
      message: error.message,
    };
  }

  throw error;
};

export const buildOrderRoutes = (
  orderService: OrderServiceContract = new OrderService(),
  authService: AuthServiceContract = new AuthService(),
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.post("/orders", async (request, reply) => {
      try {
        const body = createOrderSchema.parse(request.body);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);
        const order = await orderService.createOrder({
          userUuid,
          marketUuid: body.marketUuid,
          side: body.side,
          outcome: body.outcome,
          orderType: body.orderType,
          price: body.price,
          quantity: body.quantity,
        });

        reply.code(201);

        return {
          order,
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.get("/orders", async (request, reply) => {
      try {
        const query = listOrdersSchema.parse(request.query);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);

        return await orderService.listOrders({
          userUuid,
          marketUuid: query.marketUuid,
          status: query.status,
          limit: query.limit,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.post("/orders/:orderUuid/cancel", async (request, reply) => {
      try {
        const params = cancelOrderParamsSchema.parse(request.params);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);
        const order = await orderService.cancelOrder({
          userUuid,
          orderUuid: params.orderUuid,
        });

        return {
          order,
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });
  };
};

export const orderRoutes = buildOrderRoutes();
