import crypto from "node:crypto";
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { requestContext } from "../lib/request-context.js";
import { verifyAccessToken } from "../modules/auth/tokens.js";

declare module "fastify" {
  interface FastifyRequest {
    requestUuid: string;
  }
}

const observabilityPlugin: FastifyPluginAsync = async (fastify) => {
  const isUuid = (value: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  };

  fastify.addHook("onRequest", async (request) => {
    const headerRequestUuid = request.headers["x-request-id"];
    const requestUuid =
      typeof headerRequestUuid === "string" && isUuid(headerRequestUuid)
        ? headerRequestUuid
        : crypto.randomUUID();

    request.requestUuid = requestUuid;
  });

  fastify.addHook("preHandler", async (request) => {
    requestContext.enterWith({
      requestUuid: request.requestUuid,
      actorType: "anonymous",
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"],
    });

    request.log = request.log.child({
      request_uuid: request.requestUuid,
    });

    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return;
    }

    try {
      const payload = verifyAccessToken(authorizationHeader.replace("Bearer ", ""));

      requestContext.setActor({
        actorType: "user",
        actorUuid: payload.sub,
      });
    } catch {
      request.log.debug("access token unavailable for request context");
    }
  });

  fastify.addHook("onResponse", async (request, reply) => {
    request.log.info(
      {
        event: "http_response",
        method: request.method,
        path: request.routeOptions.url,
        status_code: reply.statusCode,
      },
      "request completed",
    );
  });

  fastify.addHook("onError", async (request, reply, error) => {
    request.log.error(
      {
        event: "http_error",
        method: request.method,
        path: request.routeOptions.url,
        status_code: reply.statusCode,
        error_name: error.name,
      },
      error.message,
    );
  });
};

export const observabilityPluginRegistered = fp(observabilityPlugin, {
  name: "observability",
});
