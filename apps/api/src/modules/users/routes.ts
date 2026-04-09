import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getAuthenticatedUserUuid } from "../auth/authenticated-user.js";
import type { AuthServiceContract } from "../auth/service.js";
import { AuthError, AuthService } from "../auth/service.js";
import type { UserServiceContract } from "./service.js";
import { UserService } from "./service.js";

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().min(8).max(32).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar o perfil.",
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

export const buildUserRoutes = (
  userService: UserServiceContract = new UserService(),
  authService: AuthServiceContract = new AuthService(),
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.get("/users/me", async (request, reply) => {
      try {
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);

        return {
          user: await userService.getProfile(userUuid),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    fastify.patch("/users/me", async (request, reply) => {
      try {
        const input = updateProfileSchema.parse(request.body);
        const userUuid = await getAuthenticatedUserUuid(request.headers.authorization, authService);

        return {
          user: await userService.updateProfile({
            userUuid,
            ...input,
          }),
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });
  };
};

export const userRoutes = buildUserRoutes();
