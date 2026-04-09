import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { webConfig } from "./config.js";
import { renderHomePage } from "./home-page.js";
import { renderWorkspacePage } from "./workspace-page.js";

export const createWebServer = () => createServer(async (request, response) => {
  await handleWebRequest(request.url ?? "/", response);
});

export const handleWebRequest = async (
  url: string,
  response: {
    writeHead: (statusCode: number, headers: Record<string, string>) => void;
    end: (payload?: string) => void;
  },
) => {
  const requestUrl = new URL(url, webConfig.APP_URL);
  const pathname = requestUrl.pathname;

  if (pathname === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderHomePage({
        appName: webConfig.APP_NAME,
        pathname,
      }),
    );
    return;
  }

  if (pathname === "/markets") {
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

  if (pathname === "/orders") {
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

  if (pathname === "/portfolio") {
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

  if (pathname === "/account/profile") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderWorkspacePage({
        appName: webConfig.APP_NAME,
        pathname,
        eyebrow: "Minha conta",
        title: "Perfil pronto para onboarding e manutencao cadastral.",
        description:
          "Esta area vai concentrar cadastro inicial, atualizacao de nome, email e telefone, alem de preparar o caminho para KYC e seguranca da conta.",
        status: "Proxima etapa: integrar GET /users/me e PATCH /users/me.",
        cards: [
          {
            title: "Perfil",
            description: "Consulta e edicao de nome, email e telefone do usuario.",
            href: "/account/profile",
            tone: "accent",
          },
          {
            title: "Seguranca",
            description: "Espaco futuro para senha, sessoes e validacoes da conta.",
            href: "/account/profile",
          },
        ],
      }),
    );
    return;
  }

  if (pathname === "/login") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderWorkspacePage({
        appName: webConfig.APP_NAME,
        pathname,
        eyebrow: "Entrar",
        title: "Login preparado para reutilizar auth existente.",
        description:
          "O portal vai reutilizar os mesmos endpoints de autenticacao do projeto, mantendo refresh token e bootstrap de sessao alinhados com o restante da plataforma.",
        status: "Proxima etapa: integrar POST /auth/login, GET /auth/me e POST /auth/refresh.",
        cards: [
          {
            title: "Sessao do usuario",
            description: "Bootstrap de sessao e protecao de rotas autenticadas.",
            href: "/login",
            tone: "accent",
          },
          {
            title: "Cadastro",
            description: "Fluxo complementar para criar uma conta antes do login.",
            href: "/register",
          },
        ],
      }),
    );
    return;
  }

  if (pathname === "/register") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      renderWorkspacePage({
        appName: webConfig.APP_NAME,
        pathname,
        eyebrow: "Criar conta",
        title: "Onboarding enxuto para entrar rapido no mercado.",
        description:
          "O cadastro vai começar com informacoes basicas: nome, email, telefone e senha, deixando a jornada pronta para login imediato e futura validacao de identidade.",
        status: "Proxima etapa: expandir users com name e phone e integrar POST /auth/register.",
        cards: [
          {
            title: "Formulario inicial",
            description: "Captura das informacoes basicas para criacao de conta.",
            href: "/register",
            tone: "accent",
          },
          {
            title: "Ja tenho conta",
            description: "Acesso ao portal com email e senha ja cadastrados.",
            href: "/login",
          },
        ],
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
