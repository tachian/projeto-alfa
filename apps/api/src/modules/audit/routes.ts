import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireAdminUser } from "../auth/authenticated-user.js";
import type { AuthServiceContract } from "../auth/service.js";
import { AuthError, AuthService } from "../auth/service.js";
import type { AuditServiceContract } from "./service.js";
import { AuditService } from "./service.js";

const listAuditLogsSchema = z.object({
  actorUuid: z.string().uuid().optional(),
  action: z.string().trim().min(1).max(120).optional(),
  targetType: z.string().trim().min(1).max(120).optional(),
  targetUuid: z.string().uuid().optional(),
  requestUuid: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const buildAuditRoutes = (
  auditService: AuditServiceContract = new AuditService(),
  authService: AuthServiceContract = new AuthService(),
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.get("/admin/audit-logs", async (request, reply) => {
      try {
        await requireAdminUser(request.headers.authorization, authService);
        const query = listAuditLogsSchema.parse(request.query);

        return await auditService.listAuditLogs(query);
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

export const auditRoutes = buildAuditRoutes();
