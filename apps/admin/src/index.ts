import { createServer } from "node:http";
import { adminConfig } from "./config.js";
import { renderMarketPage } from "./market-page.js";

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", adminConfig.APP_URL);
  const pathname = requestUrl.pathname;

  if (request.method === "GET" && pathname === "/") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${adminConfig.APP_NAME}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: linear-gradient(180deg, #fbf3e8 0%, #f2e1ca 100%);
        color: #1b1510;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }
      main {
        width: min(760px, 100%);
        padding: 28px;
        border-radius: 24px;
        background: rgba(255, 251, 245, 0.88);
        border: 1px solid rgba(70, 43, 18, 0.12);
      }
      h1 {
        margin: 0 0 12px;
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        font-size: clamp(2rem, 5vw, 3.5rem);
      }
      p {
        color: #6d5f4f;
        line-height: 1.7;
      }
      code {
        padding: 2px 6px;
        border-radius: 999px;
        background: rgba(177, 77, 45, 0.1);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Painel pronto para mercados</h1>
      <p>Abra uma pagina de mercado em <code>/markets/:marketUuid</code> para visualizar a ficha publica com estado, fonte oficial e regras de resolucao.</p>
    </main>
  </body>
</html>`);
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

  response.writeHead(404, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify({ message: "Rota nao encontrada." }));
});

server.listen(adminConfig.PORT, () => {
  console.log(`[bootstrap] ${adminConfig.APP_NAME} ready at ${adminConfig.APP_URL}`);
});
