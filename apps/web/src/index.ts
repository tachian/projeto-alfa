import type { IncomingMessage } from "node:http";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { webConfig } from "./config.js";
import { renderHomePage } from "./home-page.js";
import { renderLoginPage } from "./login-page.js";
import { renderProfilePage } from "./profile-page.js";
import { renderRegisterPage } from "./register-page.js";
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

export const createWebServer = () => createServer(async (request, response) => {
  await handleWebRequest(request, response);
});

export const handleWebRequest = async (
  request: IncomingMessage,
  response: {
    writeHead: (statusCode: number, headers: Record<string, string>) => void;
    end: (payload?: string) => void;
  },
) => {
  const proxyApiRequest = async (input: {
    path: string;
    method: string;
    body?: unknown;
  }) => {
    try {
      const authorization = request.headers.authorization;
      const upstreamResponse = await fetch(new URL(input.path, webConfig.API_URL), {
        method: input.method,
        headers: {
          ...(authorization ? { Authorization: authorization } : {}),
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

  if (request.method === "GET" && pathname === "/markets") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderWorkspacePage({
        appName: webConfig.APP_NAME,
        pathname,
        eyebrow: "Mercados",
        title: "Catalogo desenhado para consulta rapida e decisao clara.",
        description:
          "Esta area vai concentrar a listagem publica de contratos, filtros por categoria e vencimento, detalhe de mercado, book e ultimas execucoes.",
        status: "Proxima etapa: ligar esta pagina ao catalogo publico ja disponivel na API.",
        cards: [
          {
            title: "Listagem publica",
            description: "Entrada para explorar mercados abertos e resolvidos com filtros simples.",
            href: "/markets",
            tone: "accent",
          },
          {
            title: "Detalhe do mercado",
            description: "Espaco para regras, book, ultimas execucoes e formulario de ordem.",
            href: "/markets",
          },
        ],
      }),
    );
    return;
  }

  if (request.method === "GET" && pathname === "/orders") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderWorkspacePage({
        appName: webConfig.APP_NAME,
        pathname,
        eyebrow: "Ordens",
        title: "Area autenticada para acompanhar e operar.",
        description:
          "Aqui o usuario comum vai enviar ordens, acompanhar status, cancelar ordens abertas e revisar o historico recente sem depender do painel administrativo.",
        status: "Proxima etapa: integrar POST /orders, GET /orders e cancelamento de ordem.",
        authMode: "protected",
        cards: [
          {
            title: "Nova ordem",
            description: "Formulario contextual dentro do mercado para buy ou sell em contratos binarios.",
            href: "/markets",
            tone: "accent",
          },
          {
            title: "Historico operacional",
            description: "Lista de ordens abertas, parcialmente executadas, executadas e canceladas.",
            href: "/orders",
          },
        ],
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
            href: "/portfolio",
            tone: "accent",
          },
          {
            title: "PnL e liquidacoes",
            description: "Resumo consolidado de resultado e historico das liquidacoes recebidas.",
            href: "/portfolio",
          },
        ],
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
