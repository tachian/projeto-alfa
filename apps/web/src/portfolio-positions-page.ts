import { escapeHtml } from "./html.js";
import { renderWalletHeaderScript, renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderPortfolioPositionsPage = (input: {
  appName: string;
  pathname: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Posicoes | ${escapeHtml(input.appName)}</title>
    <style>
      :root {
        --bg: #f5f9fc;
        --panel: rgba(255, 255, 255, 0.92);
        --ink: #0f172a;
        --muted: #475569;
        --line: rgba(15, 23, 42, 0.08);
        --accent: #0369a1;
        --success: #166534;
        --danger: #b42318;
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
        width: min(1520px, calc(100% - 32px));
        margin: 0 auto;
        padding: 24px 0 64px;
      }

      ${renderWebChromeStyles()}

      .hero, .panel {
        border-radius: 28px;
        border: 1px solid var(--line);
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(239, 246, 255, 0.88)),
          var(--panel);
        box-shadow: var(--shadow);
      }

      .hero { padding: 32px; }

      .hero-top {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: flex-start;
      }

      .eyebrow {
        color: #0369a1;
        font-size: 0.8rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      h1, h2 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        letter-spacing: -0.03em;
      }

      h1 {
        margin-top: 12px;
        font-size: clamp(2.3rem, 5vw, 4rem);
        line-height: 0.95;
      }

      p { color: var(--muted); line-height: 1.7; }

      .identity-card, .summary-card {
        padding: 18px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.76);
      }

      .identity-label, .summary-label {
        color: #64748b;
        font-size: 0.76rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .identity-value, .summary-value {
        margin-top: 8px;
        font-weight: 700;
      }

      .identity-meta, .summary-note {
        margin-top: 6px;
        color: var(--muted);
      }

      .identity-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
      }

      .identity-actions button {
        border: 0;
        border-radius: 999px;
        padding: 10px 14px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        color: var(--ink);
        background: rgba(15, 23, 42, 0.06);
      }

      .status {
        margin-top: 18px;
        padding: 16px 18px;
        border-radius: 18px;
        background: rgba(3, 105, 161, 0.08);
        color: var(--accent);
      }

      .status[data-tone="success"] { color: var(--success); background: rgba(22, 101, 52, 0.1); }
      .status[data-tone="danger"] { color: var(--danger); background: rgba(180, 35, 24, 0.08); }

      .panel {
        margin-top: 22px;
        padding: 24px;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-top: 18px;
      }

      .summary-value {
        font-size: 1.8rem;
        letter-spacing: -0.04em;
      }

      .table-wrap {
        margin-top: 18px;
        overflow: auto;
        border-radius: 18px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        background: rgba(255, 255, 255, 0.75);
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        padding: 12px 14px;
        text-align: left;
        border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        font-size: 0.94rem;
      }

      th {
        color: var(--muted);
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        background: rgba(248, 250, 252, 0.98);
      }

      .empty-state {
        padding: 18px;
        color: var(--muted);
      }

      .action-link {
        color: var(--accent);
        text-decoration: none;
        font-weight: 700;
      }

      @media (max-width: 980px) {
        .hero-top, .summary-grid {
          flex-direction: column;
          display: grid;
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      ${renderWebNavigation({ appName: input.appName, pathname: input.pathname })}

      <section class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">Portfolio</div>
            <h1>Posicoes abertas e historicas</h1>
            <p>Veja quantidade liquida, preco medio, mark e resultado por mercado sem misturar leitura de carteira com a trilha de ordens.</p>
          </div>
          <aside class="identity-card">
            <div class="identity-label">Sessao</div>
            <div id="identity-email" class="identity-value">Nao autenticado</div>
            <div id="identity-meta" class="identity-meta">A area de portfolio valida a sessao ao carregar.</div>
            <div class="identity-actions">
              <button id="logout-button" type="button">Sair</button>
            </div>
          </aside>
        </div>
      </section>

      <section class="panel">
        <div class="eyebrow">Posicoes</div>
        <h2>Resumo por mercado e outcome</h2>
        <p>Nesta area voce acompanha exposicao, preco medio e impacto de mark-to-market da sua carteira.</p>

        <div id="positions-status" class="status">Carregando posicoes...</div>

        <div class="summary-grid">
          <article class="summary-card">
            <div class="summary-label">Posicoes</div>
            <div id="summary-count" class="summary-value">-</div>
            <div class="summary-note">Quantidade total retornada</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Mercados</div>
            <div id="summary-markets" class="summary-value">-</div>
            <div class="summary-note">Mercados distintos com posicao</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">PnL total</div>
            <div id="summary-pnl" class="summary-value">-</div>
            <div class="summary-note">Realizado + nao realizado</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Maior exposicao</div>
            <div id="summary-exposure" class="summary-value">-</div>
            <div class="summary-note">Maior quantidade liquida</div>
          </article>
        </div>

        <div class="table-wrap">
          <div id="positions-table" class="empty-state">Carregando posicoes...</div>
        </div>

        <p style="margin-top: 18px;">
          <a class="action-link" href="/portfolio/pnl">Ver resumo de PnL</a>
          &nbsp;•&nbsp;
          <a class="action-link" href="/portfolio/settlements">Ver liquidacoes</a>
        </p>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}
      ${renderWalletHeaderScript()}

      const session = window.ProjetoAlfaWebSession;
      const identityEmail = document.getElementById("identity-email");
      const identityMeta = document.getElementById("identity-meta");
      const logoutButton = document.getElementById("logout-button");
      const statusNode = document.getElementById("positions-status");
      const positionsTable = document.getElementById("positions-table");
      const summaryCount = document.getElementById("summary-count");
      const summaryMarkets = document.getElementById("summary-markets");
      const summaryPnl = document.getElementById("summary-pnl");
      const summaryExposure = document.getElementById("summary-exposure");

      const setStatus = (message, tone = "default") => {
        statusNode.dataset.tone = tone;
        statusNode.textContent = message;
      };

      const paintIdentity = (user) => {
        identityEmail.textContent = user.name || user.email;
        identityMeta.textContent = [user.email, user.phone || "telefone em breve", user.status].join(" • ");
      };

      const toNumber = (value) => Number.parseFloat(value || "0");

      const formatMoney = (value) => {
        const number = toNumber(value);
        return number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
      };

      const paintSummary = (items) => {
        const markets = new Set(items.map((item) => item.marketUuid));
        const totalPnl = items.reduce((sum, item) => sum + toNumber(item.totalPnl), 0);
        const largestExposure = items.reduce((max, item) => Math.max(max, Math.abs(item.netQuantity || 0)), 0);

        summaryCount.textContent = String(items.length);
        summaryMarkets.textContent = String(markets.size);
        summaryPnl.textContent = formatMoney(String(totalPnl));
        summaryExposure.textContent = String(largestExposure);
      };

      const renderTable = (items) => {
        if (!items.length) {
          positionsTable.innerHTML = '<div class="empty-state">Voce ainda nao possui posicoes registradas.</div>';
          return;
        }

        positionsTable.innerHTML = [
          "<table>",
            "<thead><tr><th>Mercado</th><th>Outcome</th><th>Qtd liquida</th><th>Preco medio</th><th>Mark</th><th>Realizado</th><th>Nao realizado</th><th>Total</th></tr></thead>",
            "<tbody>",
              items.map((item) => (
                "<tr>" +
                  "<td><a class=\\"action-link\\" href=\\"/markets/" + item.marketUuid + "\\">" + (item.market?.title || item.marketUuid) + "</a></td>" +
                  "<td>" + item.outcome + "</td>" +
                  "<td>" + item.netQuantity + "</td>" +
                  "<td>" + item.averageEntryPrice + "</td>" +
                  "<td>" + item.markPrice + "</td>" +
                  "<td>" + item.realizedPnl + "</td>" +
                  "<td>" + item.unrealizedPnl + "</td>" +
                  "<td>" + item.totalPnl + "</td>" +
                "</tr>"
              )).join(""),
            "</tbody>",
          "</table>",
        ].join("");
      };

      const loadPositions = async () => {
        setStatus("Carregando posicoes...");

        try {
          const payload = await session.fetchJsonWithAuth("/api/portfolio/positions?limit=100", { method: "GET" }, "Nao foi possivel carregar posicoes.");
          const items = Array.isArray(payload?.items) ? payload.items : [];
          paintSummary(items);
          renderTable(items);
          setStatus(items.length ? "Posicoes carregadas com sucesso." : "Nao ha posicoes abertas neste momento.", items.length ? "success" : "default");
        } catch (error) {
          if (error?.code === "unauthenticated") {
            session.redirectToLogin("expired");
            return;
          }

          paintSummary([]);
          positionsTable.innerHTML = '<div class="empty-state">Nao foi possivel carregar suas posicoes agora.</div>';
          setStatus(error?.message || "Nao foi possivel carregar posicoes.", "danger");
        }
      };

      logoutButton.addEventListener("click", () => {
        session.logout("logged-out");
      });

      session.resolveUser()
        .then((user) => {
          paintIdentity(user);
          return loadPositions();
        })
        .catch(() => {
          session.redirectToLogin("protected");
        });
    </script>
  </body>
</html>`;
