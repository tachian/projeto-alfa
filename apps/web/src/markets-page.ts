import { escapeHtml } from "./html.js";
import { renderWebChromeStyles, renderWebNavigation } from "./navigation.js";

export const renderMarketsPage = (input: {
  appName: string;
  pathname: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mercados | ${escapeHtml(input.appName)}</title>
    <style>
      :root {
        --bg: #f5f9fc;
        --panel: rgba(255, 255, 255, 0.92);
        --ink: #0f172a;
        --muted: #475569;
        --line: rgba(15, 23, 42, 0.08);
        --accent: #0369a1;
        --shadow: 0 24px 64px rgba(20, 34, 56, 0.1);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(125, 211, 252, 0.34), transparent 24%),
          radial-gradient(circle at top right, rgba(45, 212, 191, 0.2), transparent 22%),
          linear-gradient(180deg, #fbfdff 0%, #eef5fb 100%);
      }

      .shell {
        width: min(1180px, calc(100% - 32px));
        margin: 0 auto;
        padding: 24px 0 64px;
      }

      ${renderWebChromeStyles()}

      .hero,
      .panel,
      .market-card {
        border-radius: 28px;
        border: 1px solid var(--line);
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(239, 246, 255, 0.88)),
          var(--panel);
        box-shadow: var(--shadow);
      }

      .hero,
      .panel {
        padding: 28px;
      }

      .eyebrow {
        color: #0369a1;
        font-size: 0.8rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      h1, h2, h3 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        letter-spacing: -0.03em;
      }

      h1 {
        margin-top: 12px;
        font-size: clamp(2.6rem, 6vw, 4.4rem);
        line-height: 0.95;
        max-width: 11ch;
      }

      p {
        color: var(--muted);
        line-height: 1.7;
      }

      .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
        gap: 22px;
        align-items: start;
      }

      .filter-box {
        padding: 18px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.74);
      }

      .filter-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 16px;
      }

      label {
        display: grid;
        gap: 8px;
        color: var(--muted);
        font-size: 0.92rem;
      }

      input, select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 12px 14px;
        font: inherit;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.92);
      }

      .filter-actions {
        display: flex;
        gap: 10px;
        margin-top: 16px;
      }

      button, .button-link {
        border: 0;
        border-radius: 999px;
        padding: 12px 16px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
      }

      button {
        color: white;
        background: linear-gradient(135deg, var(--accent), #0f766e);
      }

      .button-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--ink);
        background: rgba(15, 23, 42, 0.06);
      }

      .panel {
        margin-top: 22px;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
      }

      .status {
        margin-top: 16px;
        min-height: 24px;
        color: var(--muted);
      }

      .status[data-tone="danger"] { color: #b42318; }

      .market-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
        margin-top: 20px;
      }

      .market-card {
        padding: 22px;
      }

      .market-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 14px 0;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 7px 12px;
        background: rgba(3, 105, 161, 0.1);
        color: #0369a1;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .market-card a {
        color: var(--accent);
        font-weight: 700;
        text-decoration: none;
      }

      @media (max-width: 980px) {
        .hero-grid,
        .filter-grid,
        .market-grid {
          grid-template-columns: 1fr;
        }

        .panel-header {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      ${renderWebNavigation({ appName: input.appName, pathname: input.pathname })}

      <section class="hero">
        <div class="hero-grid">
          <div>
            <div class="eyebrow">Mercados</div>
            <h1>Explore contratos com contexto antes de operar.</h1>
            <p>O portal agora consome o catalogo publico da API para listar mercados, aplicar filtros e abrir o detalhe do contrato com regras, fonte oficial, book e ultimas execucoes.</p>
          </div>

          <aside class="filter-box">
            <div class="eyebrow">Filtros</div>
            <form id="filters-form">
              <div class="filter-grid">
                <label>
                  Status
                  <select id="filter-status" name="status">
                    <option value="">Todos</option>
                    <option value="draft">draft</option>
                    <option value="open">open</option>
                    <option value="suspended">suspended</option>
                    <option value="closed">closed</option>
                    <option value="resolving">resolving</option>
                    <option value="resolved">resolved</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </label>

                <label>
                  Categoria
                  <input id="filter-category" name="category" type="text" placeholder="macro, politics..." />
                </label>

                <label>
                  Vencimento de
                  <input id="filter-close-from" name="closeAtFrom" type="datetime-local" />
                </label>

                <label>
                  Vencimento ate
                  <input id="filter-close-to" name="closeAtTo" type="datetime-local" />
                </label>
              </div>

              <div class="filter-actions">
                <button type="submit">Aplicar filtros</button>
                <a class="button-link" href="/markets">Limpar</a>
              </div>
            </form>
          </aside>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Catalogo publico</div>
            <h2>Mercados disponiveis</h2>
          </div>
          <div id="markets-summary" class="chip">Carregando...</div>
        </div>

        <div id="markets-status" class="status">Consultando mercados...</div>
        <div id="markets-grid" class="market-grid"></div>
      </section>
    </main>

    <script>
      const form = document.getElementById("filters-form");
      const statusSelect = document.getElementById("filter-status");
      const categoryInput = document.getElementById("filter-category");
      const closeFromInput = document.getElementById("filter-close-from");
      const closeToInput = document.getElementById("filter-close-to");
      const statusNode = document.getElementById("markets-status");
      const summaryNode = document.getElementById("markets-summary");
      const gridNode = document.getElementById("markets-grid");

      const setStatus = (message, tone = "default") => {
        statusNode.dataset.tone = tone;
        statusNode.textContent = message;
      };

      const params = new URLSearchParams(window.location.search);
      statusSelect.value = params.get("status") || "";
      categoryInput.value = params.get("category") || "";

      const toLocalDateTime = (value) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };

      closeFromInput.value = toLocalDateTime(params.get("closeAtFrom"));
      closeToInput.value = toLocalDateTime(params.get("closeAtTo"));

      const renderMarketCard = (market) => {
        const chips = [
          '<span class="chip">' + market.status + '</span>',
          '<span class="chip">' + market.category + '</span>',
          '<span class="chip">' + market.outcomeType + '</span>',
        ].join("");

        const closeAt = new Date(market.closeAt).toLocaleString("pt-BR");

        return [
          '<article class="market-card">',
            '<div class="eyebrow">Contrato</div>',
            '<h3>' + market.title + '</h3>',
            '<div class="market-meta">' + chips + '</div>',
            '<p>Slug: ' + market.slug + '<br />Fecha em: ' + closeAt + '<br />Fonte: ' + (market.rules?.officialSourceLabel || "Nao informada") + '</p>',
            '<a href="/markets/' + market.uuid + '">Abrir detalhe</a>',
          '</article>'
        ].join("");
      };

      const loadMarkets = async () => {
        const query = new URLSearchParams(window.location.search);

        try {
          const response = await fetch('/api/markets' + (query.toString() ? '?' + query.toString() : ''));
          const payloadText = await response.text();
          const payload = payloadText ? JSON.parse(payloadText) : null;

          if (!response.ok) {
            summaryNode.textContent = "Falha";
            setStatus(payload?.message || "Nao foi possivel consultar o catalogo publico.", "danger");
            gridNode.innerHTML = "";
            return;
          }

          const items = payload.items || [];
          summaryNode.textContent = items.length + (items.length === 1 ? " mercado" : " mercados");

          if (!items.length) {
            setStatus("Nenhum mercado encontrado com os filtros atuais.");
            gridNode.innerHTML = "";
            return;
          }

          setStatus("Catalogo carregado. Abra um mercado para ver book, trades e regras.");
          gridNode.innerHTML = items.map(renderMarketCard).join("");
        } catch {
          summaryNode.textContent = "Falha";
          setStatus("Nao foi possivel consultar o catalogo publico neste momento.", "danger");
          gridNode.innerHTML = "";
        }
      };

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        const nextUrl = new URL(window.location.href);
        const nextSearch = nextUrl.searchParams;

        const status = statusSelect.value.trim();
        const category = categoryInput.value.trim();
        const closeAtFrom = closeFromInput.value;
        const closeAtTo = closeToInput.value;

        const toIso = (value) => value ? new Date(value).toISOString() : "";

        if (status) nextSearch.set("status", status); else nextSearch.delete("status");
        if (category) nextSearch.set("category", category); else nextSearch.delete("category");
        if (closeAtFrom) nextSearch.set("closeAtFrom", toIso(closeAtFrom)); else nextSearch.delete("closeAtFrom");
        if (closeAtTo) nextSearch.set("closeAtTo", toIso(closeAtTo)); else nextSearch.delete("closeAtTo");

        window.location.href = nextUrl.toString();
      });

      loadMarkets();
    </script>
  </body>
</html>`;
