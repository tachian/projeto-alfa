import crypto from "node:crypto";
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { recordHttpResponseMetric } from "../lib/metrics.js";
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
    request.headers["x-content-type-options"] = undefined;
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
    const routePath = request.routeOptions.url ?? request.url;

    recordHttpResponseMetric({
      method: request.method,
      path: routePath,
      statusCode: reply.statusCode,
    });

    request.log.info(
      {
        event: "http_response",
        method: request.method,
        path: routePath,
        status_code: reply.statusCode,
      },
      "request completed",
    );
  });

  fastify.addHook("onSend", async (_request, reply, payload) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    reply.header("x-robots-tag", "noindex, nofollow");

    return payload;
  });

  fastify.addHook("onError", async (request, reply, error) => {
    const routePath = request.routeOptions.url ?? request.url;

    request.log.error(
      {
        event: "http_error",
        method: request.method,
        path: routePath,
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
