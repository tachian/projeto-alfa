import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getAuthenticatedUserUuid } from "../auth/authenticated-user.js";
import type { AuthServiceContract } from "../auth/service.js";
import { AuthError, AuthService } from "../auth/service.js";
import { KycError, KycService, type KycServiceContract } from "./service.js";

const submissionSchema = z.object({
  fullName: z.string().trim().min(3).max(255),
  documentType: z.string().trim().min(2).max(60),
  documentNumber: z.string().trim().min(4).max(80),
  countryCode: z.string().trim().length(2).toUpperCase(),
  birthDate: z.coerce.date().optional(),
});

const handleRouteError = (error: unknown, reply: { code: (statusCode: number) => void }) => {
  if (error instanceof AuthError || error instanceof KycError) {
    reply.code(error.statusCode);

    return {
      message: error.message,
    };
  }

  throw error;
};

export const buildKycRoutes = (
  kycService: KycServiceContract = new KycService(),
  authService: AuthServiceContract = new AuthService(),
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.post("/kyc/submissions", async (request, reply) => {
      try {
        const body = submissionSchema.parse(request.body);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);
        const verification = await kycService.submitVerification({
          userUuid,
          fullName: body.fullName,
          documentType: body.documentType,
          documentNumber: body.documentNumber,
          countryCode: body.countryCode,
          birthDate: body.birthDate,
        });

        reply.code(201);

        return {
          verification,
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.get("/kyc/submissions/latest", async (request, reply) => {
      try {
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);

        return {
          verification: await kycService.getLatestVerification(userUuid),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.get("/kyc/requirements", async (request, reply) => {
      try {
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);

        return await kycService.getRequirements(userUuid);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });
  };
};

export const kycRoutes = buildKycRoutes();
