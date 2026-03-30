import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
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

const server = createServer(async (request, response) => {
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
    const marketUuid = pathname.replace("/api/markets/", "").trim();

    try {
      const upstreamResponse = await fetch(
        new URL(`/markets/${marketUuid}`, adminConfig.ADMIN_API_URL),
      );
      const contentType = upstreamResponse.headers.get("content-type") ?? "application/json; charset=utf-8";
      const payload = await upstreamResponse.text();

      response.writeHead(upstreamResponse.status, {
        "content-type": contentType,
      });
      response.end(payload);
    } catch {
      response.writeHead(502, {
        "content-type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify({ message: "Falha ao consultar a API de mercados." }));
    }
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
});

server.listen(adminConfig.PORT, () => {
  console.log(`[bootstrap] ${adminConfig.APP_NAME} ready at ${adminConfig.APP_URL}`);
});
