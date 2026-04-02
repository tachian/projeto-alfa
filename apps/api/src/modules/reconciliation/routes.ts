import type { FastifyPluginAsync } from "fastify";
import { requireAdminUser } from "../auth/authenticated-user.js";
import type { AuthServiceContract } from "../auth/service.js";
import { AuthError, AuthService } from "../auth/service.js";
import type { ReconciliationServiceContract } from "./service.js";
import { ReconciliationService } from "./service.js";

export const buildReconciliationRoutes = (
  reconciliationService: ReconciliationServiceContract = new ReconciliationService(),
  authService: AuthServiceContract = new AuthService(),
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.get("/admin/reconciliation/report", async (request, reply) => {
      try {
        await requireAdminUser(request.headers.authorization, authService);

        return await reconciliationService.generateReport();
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

export const reconciliationRoutes = buildReconciliationRoutes();
