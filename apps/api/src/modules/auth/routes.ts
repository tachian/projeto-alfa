import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { AuthServiceContract } from "./service.js";
import { AuthError, AuthService } from "./service.js";
import { verifyAccessToken } from "./tokens.js";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const buildAuthRoutes = (
  authService: AuthServiceContract = new AuthService(),
): FastifyPluginAsync => {
  return async (fastify) => {
  fastify.post("/auth/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);

    try {
      const result = await authService.register(input);
      reply.code(201);

      return result;
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

  fastify.post("/auth/login", async (request, reply) => {
    const input = registerSchema.parse(request.body);

    try {
      return await authService.login(input);
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

  fastify.post("/auth/refresh", async (request, reply) => {
    const input = refreshSchema.parse(request.body);

    try {
      return await authService.refresh(input.refreshToken);
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

  fastify.get("/auth/me", async (request, reply) => {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
      reply.code(401);

      return {
        message: "Token de acesso ausente.",
      };
    }

    const accessToken = authorizationHeader.replace("Bearer ", "");

    try {
      const payload = verifyAccessToken(accessToken);
      const user = await authService.getCurrentUser(payload.sub);

      return {
        user,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        reply.code(error.statusCode);

        return {
          message: error.message,
        };
      }

      reply.code(401);

      return {
        message: "Token de acesso invalido.",
      };
    }
  });
  };
};

export const authRoutes = buildAuthRoutes();
