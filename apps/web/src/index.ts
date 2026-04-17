import type { IncomingMessage } from "node:http";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { webConfig } from "./config.js";
import { renderHomePage } from "./home-page.js";
import { renderLoginPage } from "./login-page.js";
import { renderMarketDetailPage } from "./market-detail-page.js";
import { renderMarketsPage } from "./markets-page.js";
import { renderOrdersPage } from "./orders-page.js";
import { renderPaymentsDepositPage } from "./payments-deposit-page.js";
import { renderPaymentsHistoryPage } from "./payments-history-page.js";
import { renderPaymentsWithdrawPage } from "./payments-withdraw-page.js";
import { renderPortfolioPnlPage } from "./portfolio-pnl-page.js";
import { renderPortfolioPositionsPage } from "./portfolio-positions-page.js";
import { renderPortfolioSettlementsPage } from "./portfolio-settlements-page.js";
import { renderProfilePage } from "./profile-page.js";
import { renderVerificationPage } from "./verification-page.js";
import { renderRegisterPage } from "./register-page.js";
import { renderWalletPage } from "./wallet-page.js";
import { renderWorkspacePage } from "./workspace-page.js";

const parseJson = (value: string): unknown => JSON.parse(value) as unknown;

const readJsonBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
      continue;
    }

    if (chunk instanceof Uint8Array) {
      chunks.push(Buffer.from(chunk));
      continue;
    }

    chunks.push(Buffer.from(String(chunk)));
  }

  if (!chunks.length) {
    return null;
  }

  return parseJson(Buffer.concat(chunks).toString("utf8"));
};

export const createWebServer = () =>
  createServer((request, response) => {
    void handleWebRequest(request, response);
  });

export const handleWebRequest = async (
  request: IncomingMessage,
  response: {
    writeHead: (statusCode: number, headers: Record<string, string>) => void;
    end: (payload?: string) => void;
  },
) => {
  const getRequestHeader = (name: string) => {
    const target = name.toLowerCase();

    for (const [headerName, headerValue] of Object.entries(request.headers)) {
      if (headerName.toLowerCase() !== target) {
        continue;
      }

      if (Array.isArray(headerValue)) {
        return headerValue[0];
      }

      return headerValue;
    }

    return undefined;
  };

  const proxyApiRequest = async (input: {
    path: string;
    method: string;
    body?: unknown;
  }) => {
    try {
      const authorization = getRequestHeader("authorization");
      const idempotencyKey = getRequestHeader("idempotency-key");
      const upstreamResponse = await fetch(new URL(input.path, webConfig.API_URL), {
        method: input.method,
        headers: {
          ...(authorization ? { Authorization: authorization } : {}),
          ...(typeof idempotencyKey === "string" ? { "Idempotency-Key": idempotencyKey } : {}),
          ...(input.body ? { "Content-Type": "application/json" } : {}),
        },
        body: input.body ? JSON.stringify(input.body) : undefined,
      });

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
      response.end(JSON.stringify({ message: "Falha ao consultar a API do portal." }));
    }
  };

  const requestUrl = new URL(request.url ?? "/", webConfig.APP_URL);
  const pathname = requestUrl.pathname;

  if (request.method === "GET" && pathname === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderHomePage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/register") {
    const body = await readJsonBody(request);
    await proxyApiRequest({
      path: "/auth/register",
      method: "POST",
      body,
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/login") {
    const body = await readJsonBody(request);
    await proxyApiRequest({
      path: "/auth/login",
      method: "POST",
      body,
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/refresh") {
    const body = await readJsonBody(request);
    await proxyApiRequest({
      path: "/auth/refresh",
      method: "POST",
      body,
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/auth/me") {
    await proxyApiRequest({
      path: "/auth/me",
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/users/me") {
    await proxyApiRequest({
      path: "/users/me",
      method: "GET",
    });
    return;
  }

  if (request.method === "PATCH" && pathname === "/api/users/me") {
    const body = await readJsonBody(request);
    await proxyApiRequest({
      path: "/users/me",
      method: "PATCH",
      body,
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/kyc/submissions") {
    const body = await readJsonBody(request);
    await proxyApiRequest({
      path: "/kyc/submissions",
      method: "POST",
      body,
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/kyc/submissions/latest") {
    await proxyApiRequest({
      path: "/kyc/submissions/latest",
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/kyc/requirements") {
    await proxyApiRequest({
      path: "/kyc/requirements",
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/markets") {
    await proxyApiRequest({
      path: `/markets${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && /^\/api\/markets\/[0-9a-f-]+$/.test(pathname)) {
    const marketUuid = pathname.replace("/api/markets/", "");
    await proxyApiRequest({
      path: `/markets/${marketUuid}`,
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && /^\/api\/markets\/[0-9a-f-]+\/book$/.test(pathname)) {
    const marketUuid = pathname.replace("/api/markets/", "").replace("/book", "");
    await proxyApiRequest({
      path: `/markets/${marketUuid}/book`,
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && /^\/api\/markets\/[0-9a-f-]+\/trades$/.test(pathname)) {
    const marketUuid = pathname.replace("/api/markets/", "").replace("/trades", "");
    await proxyApiRequest({
      path: `/markets/${marketUuid}/trades${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/orders") {
    const body = await readJsonBody(request);
    await proxyApiRequest({
      path: "/orders",
      method: "POST",
      body,
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/orders") {
    await proxyApiRequest({
      path: `/orders${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (request.method === "POST" && /^\/api\/orders\/[0-9a-f-]+\/cancel$/.test(pathname)) {
    const orderUuid = pathname.replace("/api/orders/", "").replace("/cancel", "");
    await proxyApiRequest({
      path: `/orders/${orderUuid}/cancel`,
      method: "POST",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/portfolio/positions") {
    await proxyApiRequest({
      path: `/portfolio/positions${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/portfolio/pnl") {
    await proxyApiRequest({
      path: "/portfolio/pnl",
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/portfolio/settlements") {
    await proxyApiRequest({
      path: `/portfolio/settlements${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/wallet/balance") {
    await proxyApiRequest({
      path: `/wallet/balance${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/wallet/entries") {
    await proxyApiRequest({
      path: `/wallet/entries${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/payments/deposits") {
    const body = await readJsonBody(request);
    await proxyApiRequest({
      path: "/payments/deposits",
      method: "POST",
      body,
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/payments/withdrawals") {
    const body = await readJsonBody(request);
    await proxyApiRequest({
      path: "/payments/withdrawals",
      method: "POST",
      body,
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/payments/deposits") {
    await proxyApiRequest({
      path: `/payments/deposits${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/payments/withdrawals") {
    await proxyApiRequest({
      path: `/payments/withdrawals${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/payments/methods") {
    await proxyApiRequest({
      path: `/payments/methods${requestUrl.search}`,
      method: "GET",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/markets") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderMarketsPage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && /^\/markets\/[0-9a-f-]+$/.test(pathname)) {
    const marketUuid = pathname.replace("/markets/", "");

    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderMarketDetailPage({
        appName: webConfig.APP_NAME,
        pathname,
        marketUuid,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/orders") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderOrdersPage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/wallet") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderWalletPage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/payments") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderWorkspacePage({
        appName: webConfig.APP_NAME,
        pathname,
        eyebrow: "Movimentacoes",
        title: "Entrada, retirada e historico financeiro em uma trilha propria.",
        description:
          "A area de movimentacoes separa cash-in, cash-out e historico de pagamentos da carteira e do trading, preparando o portal para PIX e provedores externos.",
        status: "Primeira etapa: organizar a navegacao e a linguagem de produto antes de conectar fluxos reais de deposito e saque.",
        authMode: "protected",
        cards: [
          {
            title: "Depositar",
            description: "Entrada de recursos para a carteira, preparada para evoluir de fluxo manual para PIX ou provedor externo.",
            href: "/payments/deposit",
            tone: "accent",
          },
          {
            title: "Sacar",
            description: "Solicitacoes de retirada com contexto de saldo disponivel, limites e futura integracao com cash-out real.",
            href: "/payments/withdraw",
          },
          {
            title: "Historico",
            description: "Visao unica das movimentacoes financeiras para acompanhar status, metodo e conciliacao do usuario.",
            href: "/payments/history",
          },
        ],
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/payments/deposit") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderPaymentsDepositPage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/payments/withdraw") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderPaymentsWithdrawPage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/payments/history") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderPaymentsHistoryPage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/portfolio") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderWorkspacePage({
        appName: webConfig.APP_NAME,
        pathname,
        eyebrow: "Portfolio",
        title: "Posicoes, PnL e liquidacoes em uma trilha propria.",
        description:
          "A experiencia do usuario vai separar claramente o acompanhamento de performance da area de envio de ordens, reduzindo ruido e facilitando leitura de resultado.",
        status: "Proxima etapa: integrar posicoes, resumo de PnL e historico de liquidacoes.",
        authMode: "protected",
        cards: [
          {
            title: "Posicoes",
            description: "Resumo por mercado e outcome com preco medio e exposicao.",
            href: "/portfolio/positions",
            tone: "accent",
          },
          {
            title: "PnL e liquidacoes",
            description: "Resumo consolidado de resultado e historico das liquidacoes recebidas.",
            href: "/portfolio/pnl",
          },
          {
            title: "Liquidacoes",
            description: "Historico de settlements recebidos para fechar o ciclo completo da operacao.",
            href: "/portfolio/settlements",
          },
        ],
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/portfolio/positions") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderPortfolioPositionsPage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/portfolio/pnl") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderPortfolioPnlPage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/portfolio/settlements") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderPortfolioSettlementsPage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/account/profile") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderProfilePage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/account/verification") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderVerificationPage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/login") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderLoginPage({
        appName: webConfig.APP_NAME,
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/register") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderRegisterPage({
        appName: webConfig.APP_NAME,
      }),
    );
    return;
  }

  response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
  response.end(
    renderWorkspacePage({
      appName: webConfig.APP_NAME,
      pathname,
      eyebrow: "Nao encontrado",
      title: "A rota solicitada ainda nao faz parte do portal.",
      description:
        "A fundacao do portal ja organiza navegacao e areas principais. Agora podemos conectar cadastro, mercados e portfolio sem reorganizar tudo depois.",
      cards: [
        {
          title: "Voltar para a home",
          description: "Retorne ao ponto de entrada do portal do usuario.",
          href: "/",
          tone: "accent",
        },
      ],
    }),
  );
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  createWebServer().listen(webConfig.PORT, () => {
    console.log(`[web] ${webConfig.APP_NAME} listening on ${webConfig.APP_URL}`);
  });
}
