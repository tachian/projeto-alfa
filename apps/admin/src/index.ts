import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { renderAdminDashboardPage } from "./admin-dashboard.js";
import { adminConfig } from "./config.js";
import { renderLoginPage } from "./login-page.js";
import { renderMarketPage } from "./market-page.js";
import { renderPortfolioPnlPage } from "./portfolio-pnl-page.js";
import { renderPortfolioPositionsPage } from "./portfolio-positions-page.js";
import { renderPortfolioSettlementsPage } from "./portfolio-settlements-page.js";
import { renderTradingNewPage } from "./trading-new-page.js";
import { renderTradingOrdersPage } from "./trading-orders-page.js";
import { renderWorkspacePage } from "./workspace-page.js";

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
      renderWorkspacePage({
        appName: adminConfig.APP_NAME,
        pathname,
        eyebrow: "Dashboard",
        title: "Centro operacional do admin",
        description: "Use o menu para navegar entre mercados, trading e portfolio sem concentrar toda a operacao em uma unica tela.",
        cards: [
          {
            title: "Mercados",
            description: "Crie, suspenda, feche e acompanhe contratos com regras e resolucoes claras.",
            href: "/markets",
            tone: "accent",
          },
          {
            title: "Trading",
            description: "Area reservada para envio de ordens, acompanhamento operacional e execucao.",
            href: "/trading",
          },
          {
            title: "Portfolio",
            description: "Consulte posicoes, PnL e historico de liquidacoes em uma area dedicada.",
            href: "/portfolio",
          },
        ],
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/login") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      renderLoginPage({
        appName: adminConfig.APP_NAME,
      }),
    );
    return;
  }

  if (pathname === "/api/auth/login" && request.method === "POST") {
    const body = await readJsonBody(request);
    await proxyApiRequest({
      request,
      response,
      path: "/auth/login",
      method: "POST",
      body,
    });
    return;
  }

  if (pathname === "/api/auth/refresh" && request.method === "POST") {
    const body = await readJsonBody(request);
    await proxyApiRequest({
      request,
      response,
      path: "/auth/refresh",
      method: "POST",
      body,
    });
    return;
  }

  if (pathname === "/api/auth/me" && request.method === "GET") {
    await proxyApiRequest({
      request,
      response,
      path: "/auth/me",
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/markets") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      renderAdminDashboardPage({
        appName: adminConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/trading") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      renderWorkspacePage({
        appName: adminConfig.APP_NAME,
        pathname,
        eyebrow: "Trading",
        title: "Mesa operacional em preparacao",
        description: "Esta area vai concentrar envio de ordens, ordens abertas e execucoes sem poluir as telas de mercado.",
        cards: [
          {
            title: "Nova ordem",
            description: "Formulario dedicado para entrada de ordens com contexto operacional claro.",
            href: "/trading/new",
            tone: "accent",
          },
          {
            title: "Ordens do usuario",
            description: "Lista de ordens abertas e historico recente com acoes de cancelamento.",
            href: "/trading/orders",
          },
        ],
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/trading/new") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      renderTradingNewPage({
        appName: adminConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/trading/orders") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      renderTradingOrdersPage({
        appName: adminConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/portfolio") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      renderWorkspacePage({
        appName: adminConfig.APP_NAME,
        pathname,
        eyebrow: "Portfolio",
        title: "Portfolio operacional em preparacao",
        description: "Esta area organiza posicoes, PnL e liquidacoes em telas separadas da administracao de mercados e da mesa de trading.",
        cards: [
          {
            title: "Posicoes",
            description: "Tabela dedicada para quantidade liquida, preco medio e exposicao por mercado.",
            href: "/portfolio/positions",
            tone: "accent",
          },
          {
            title: "PnL",
            description: "Resumo financeiro agregado com realizado, nao realizado e total da carteira.",
            href: "/portfolio/pnl",
          },
          {
            title: "Liquidacoes",
            description: "Historico de settlement por mercado para acompanhar o ciclo completo dos contratos.",
            href: "/portfolio/settlements",
          },
        ],
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/portfolio/positions") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      renderPortfolioPositionsPage({
        appName: adminConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/portfolio/pnl") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      renderPortfolioPnlPage({
        appName: adminConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/portfolio/settlements") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      renderPortfolioSettlementsPage({
        appName: adminConfig.APP_NAME,
        pathname,
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

  if (pathname === "/api/markets" && request.method === "GET") {
    try {
      const upstreamResponse = await fetch(new URL(`/markets${requestUrl.search}`, adminConfig.ADMIN_API_URL));
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

  if (pathname === "/api/orders" && request.method === "POST") {
    const body = await readJsonBody(request);
    await proxyApiRequest({
      request,
      response,
      path: "/orders",
      method: "POST",
      body,
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

  if (pathname === "/api/portfolio/positions" && request.method === "GET") {
    await proxyApiRequest({
      request,
      response,
      path: `/portfolio/positions${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (pathname === "/api/portfolio/pnl" && request.method === "GET") {
    await proxyApiRequest({
      request,
      response,
      path: "/portfolio/pnl",
      method: "GET",
    });
    return;
  }

  if (pathname === "/api/portfolio/settlements" && request.method === "GET") {
    await proxyApiRequest({
      request,
      response,
      path: `/portfolio/settlements${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (pathname.startsWith("/api/orders/") && pathname.endsWith("/cancel") && request.method === "POST") {
    const orderUuid = pathname.replace("/api/orders/", "").replace("/cancel", "").trim();
    await proxyApiRequest({
      request,
      response,
      path: `/orders/${orderUuid}/cancel`,
      method: "POST",
    });
    return;
  }

  if (
    pathname.startsWith("/api/admin/markets/") &&
    (pathname.endsWith("/resolutions") || pathname.endsWith("/settlement-runs")) &&
    ["GET", "POST"].includes(request.method ?? "")
  ) {
    const body = request.method === "POST" ? await readJsonBody(request) : undefined;
    const adminPath = pathname.replace("/api", "");
    await proxyApiRequest({
      request,
      response,
      path: adminPath,
      method: request.method ?? "GET",
      body,
    });
    return;
  }

  if (pathname.startsWith("/api/admin/settlement-runs/") && request.method === "PATCH") {
    const settlementRunUuid = pathname.replace("/api/admin/settlement-runs/", "").trim();
    const body = await readJsonBody(request);
    await proxyApiRequest({
      request,
      response,
      path: `/admin/settlement-runs/${settlementRunUuid}`,
      method: "PATCH",
      body,
    });
    return;
  }

  if (pathname.startsWith("/api/admin/settlement-runs/") && pathname.endsWith("/execute") && request.method === "POST") {
    const settlementRunUuid = pathname
      .replace("/api/admin/settlement-runs/", "")
      .replace("/execute", "")
      .trim();
    await proxyApiRequest({
      request,
      response,
      path: `/admin/settlement-runs/${settlementRunUuid}/execute`,
      method: "POST",
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
