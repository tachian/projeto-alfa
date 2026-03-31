import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { renderAdminDashboardPage } from "./admin-dashboard.js";
import { adminConfig } from "./config.js";
import { renderMarketPage } from "./market-page.js";

const readJsonBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return null;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const proxyApiRequest = async (input: {
  request: IncomingMessage;
  response: ServerResponse<IncomingMessage>;
  path: string;
  method: string;
  body?: unknown;
}) => {
  try {
    const authorization = input.request.headers.authorization;
    const upstreamResponse = await fetch(new URL(input.path, adminConfig.ADMIN_API_URL), {
      method: input.method,
      headers: {
        ...(authorization ? { Authorization: authorization } : {}),
        ...(input.body ? { "Content-Type": "application/json" } : {}),
      },
      body: input.body ? JSON.stringify(input.body) : undefined,
    });

    const contentType = upstreamResponse.headers.get("content-type") ?? "application/json; charset=utf-8";
    const payload = await upstreamResponse.text();

    input.response.writeHead(upstreamResponse.status, {
      "content-type": contentType,
    });
    input.response.end(payload);
  } catch {
    input.response.writeHead(502, {
      "content-type": "application/json; charset=utf-8",
    });
    input.response.end(JSON.stringify({ message: "Falha ao consultar a API administrativa." }));
  }
};

const proxyPublicMarketRequest = async (input: {
  response: ServerResponse<IncomingMessage>;
  marketUuid: string;
  resource?: "book" | "trades";
  search?: string;
}) => {
  const suffix = input.resource ? `/${input.resource}` : "";

  try {
    const upstreamResponse = await fetch(
      new URL(`/markets/${input.marketUuid}${suffix}${input.search ?? ""}`, adminConfig.ADMIN_API_URL),
    );
    const contentType = upstreamResponse.headers.get("content-type") ?? "application/json; charset=utf-8";
    const payload = await upstreamResponse.text();

    input.response.writeHead(upstreamResponse.status, {
      "content-type": contentType,
    });
    input.response.end(payload);
  } catch {
    input.response.writeHead(502, {
      "content-type": "application/json; charset=utf-8",
    });
    input.response.end(JSON.stringify({ message: "Falha ao consultar a API de mercados." }));
  }
};

export const createAdminServer = () => createServer(async (request, response) => {
  return handleAdminRequest(request, response);
});

export const handleAdminRequest = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url ?? "/", adminConfig.APP_URL);
  const pathname = requestUrl.pathname;

  if (request.method === "GET" && pathname === "/") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      renderAdminDashboardPage({
        appName: adminConfig.APP_NAME,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname.startsWith("/markets/")) {
    const marketUuid = pathname.replace("/markets/", "").trim();

    if (!marketUuid) {
      response.writeHead(400, {
        "content-type": "text/plain; charset=utf-8",
      });
      response.end("marketUuid ausente.");
      return;
    }

    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      renderMarketPage({
        appName: adminConfig.APP_NAME,
        marketUuid,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname.startsWith("/api/markets/")) {
    const remainder = pathname.replace("/api/markets/", "").trim();
    const [marketUuid, resource] = remainder.split("/");

    await proxyPublicMarketRequest({
      response,
      marketUuid,
      resource: resource === "book" || resource === "trades" ? resource : undefined,
      search: requestUrl.search,
    });
    return;
  }

  if (pathname === "/api/orders" && request.method === "GET") {
    await proxyApiRequest({
      request,
      response,
      path: `/orders${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (pathname === "/api/admin/markets" && (request.method === "GET" || request.method === "POST")) {
    const body = request.method === "POST" ? await readJsonBody(request) : undefined;
    await proxyApiRequest({
      request,
      response,
      path: "/admin/markets",
      method: request.method,
      body,
    });
    return;
  }

  if (pathname.startsWith("/api/admin/markets/") && ["GET", "PATCH"].includes(request.method ?? "")) {
    const marketUuid = pathname.replace("/api/admin/markets/", "").trim();
    const body = request.method === "PATCH" ? await readJsonBody(request) : undefined;
    await proxyApiRequest({
      request,
      response,
      path: `/admin/markets/${marketUuid}`,
      method: request.method ?? "GET",
      body,
    });
    return;
  }

  response.writeHead(404, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify({ message: "Rota nao encontrada." }));
};

export const startAdminServer = () => {
  const server = createAdminServer();

  server.listen(adminConfig.PORT, () => {
    console.log(`[bootstrap] ${adminConfig.APP_NAME} ready at ${adminConfig.APP_URL}`);
  });

  return server;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startAdminServer();
}
