import { escapeHtml } from "./html.js";
import { renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderPortfolioSettlementsPage = (input: {
  appName: string;
  pathname: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Liquidacoes | ${escapeHtml(input.appName)}</title>
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
        width: min(1180px, calc(100% - 32px));
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
            <h1>Historico de liquidacoes</h1>
            <p>Acompanhe os settlements ja processados para entender como cada mercado impactou sua carteira ao longo do tempo.</p>
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
        <div class="eyebrow">Liquidacoes</div>
        <h2>Settlement por mercado</h2>
        <p>Use esta trilha para entender payout, direcao da posicao e resultado final de cada contrato liquidado.</p>

        <div id="settlements-status" class="status">Carregando historico de liquidacoes...</div>

        <div class="summary-grid">
          <article class="summary-card">
            <div class="summary-label">Liquidacoes</div>
            <div id="summary-count" class="summary-value">-</div>
            <div class="summary-note">Registros retornados</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Vitorias</div>
            <div id="summary-wins" class="summary-value">-</div>
            <div class="summary-note">Settlements com status won</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Derrotas</div>
            <div id="summary-losses" class="summary-value">-</div>
            <div class="summary-note">Settlements com status lost</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Payout total</div>
            <div id="summary-payout" class="summary-value">-</div>
            <div class="summary-note">Soma dos payouts recebidos</div>
          </article>
        </div>

        <div class="table-wrap">
          <div id="settlements-table" class="empty-state">Carregando liquidacoes...</div>
        </div>

        <p style="margin-top: 18px;">
          <a class="action-link" href="/portfolio/pnl">Voltar para resumo de PnL</a>
        </p>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}

      const session = window.ProjetoAlfaWebSession;
      const identityEmail = document.getElementById("identity-email");
      const identityMeta = document.getElementById("identity-meta");
      const logoutButton = document.getElementById("logout-button");
      const statusNode = document.getElementById("settlements-status");
      const settlementsTable = document.getElementById("settlements-table");
      const summaryCount = document.getElementById("summary-count");
      const summaryWins = document.getElementById("summary-wins");
      const summaryLosses = document.getElementById("summary-losses");
      const summaryPayout = document.getElementById("summary-payout");

      const setStatus = (message, tone = "default") => {
        statusNode.dataset.tone = tone;
        statusNode.textContent = message;
      };

      const redirectToLogin = (reason = "expired") => {
        const url = new URL("/login", window.location.origin);
        url.searchParams.set("reason", reason);
        window.location.href = url.toString();
      };

      const paintIdentity = (user) => {
        identityEmail.textContent = user.name || user.email;
        identityMeta.textContent = [user.email, user.phone || "telefone em breve", user.status].join(" • ");
      };

      const toNumber = (value) => Number.parseFloat(value || "0");
      const formatMoney = (value) => toNumber(value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });

      const formatTimestamp = (value) => {
        if (!value) {
          return "n/d";
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
      };

      const paintSummary = (items) => {
        summaryCount.textContent = String(items.length);
        summaryWins.textContent = String(items.filter((item) => item.status === "won").length);
        summaryLosses.textContent = String(items.filter((item) => item.status === "lost").length);
        summaryPayout.textContent = formatMoney(String(items.reduce((sum, item) => sum + toNumber(item.payoutAmount), 0)));
      };

      const renderTable = (items) => {
        if (!items.length) {
          settlementsTable.innerHTML = '<div class="empty-state">Nenhuma liquidacao registrada ate o momento.</div>';
          return;
        }

        settlementsTable.innerHTML = [
          "<table>",
            "<thead><tr><th>Mercado</th><th>Outcome</th><th>Vencedor</th><th>Direcao</th><th>Contratos</th><th>Payout</th><th>PnL</th><th>Status</th><th>Criado em</th></tr></thead>",
            "<tbody>",
              items.map((item) => (
                "<tr>" +
                  "<td><a class=\\"action-link\\" href=\\"/markets/" + item.marketUuid + "\\">" + (item.market?.title || item.marketUuid) + "</a></td>" +
                  "<td>" + item.outcome + "</td>" +
                  "<td>" + item.winningOutcome + "</td>" +
                  "<td>" + item.positionDirection + "</td>" +
                  "<td>" + item.contractsSettled + "</td>" +
                  "<td>" + item.payoutAmount + "</td>" +
                  "<td>" + item.realizedPnlDelta + "</td>" +
                  "<td>" + item.status + "</td>" +
                  "<td>" + formatTimestamp(item.createdAt) + "</td>" +
                "</tr>"
              )).join(""),
            "</tbody>",
          "</table>",
        ].join("");
      };

      const loadSettlements = async () => {
        setStatus("Carregando historico de liquidacoes...");

        try {
          const payload = await session.fetchJsonWithAuth("/api/portfolio/settlements?limit=100", { method: "GET" }, "Nao foi possivel carregar liquidacoes.");
          const items = Array.isArray(payload?.items) ? payload.items : [];
          paintSummary(items);
          renderTable(items);
          setStatus(items.length ? "Liquidacoes carregadas com sucesso." : "Ainda nao ha liquidacoes registradas.", items.length ? "success" : "default");
        } catch (error) {
          if (error?.code === "unauthenticated") {
            redirectToLogin("expired");
            return;
          }

          paintSummary([]);
          settlementsTable.innerHTML = '<div class="empty-state">Nao foi possivel carregar suas liquidacoes agora.</div>';
          setStatus(error?.message || "Nao foi possivel carregar liquidacoes.", "danger");
        }
      };

      logoutButton.addEventListener("click", () => {
        session.logout("logged-out");
      });

      session.resolveUser()
        .then((user) => {
          paintIdentity(user);
          return loadSettlements();
        })
        .catch(() => {
          redirectToLogin("expired");
        });
    </script>
  </body>
</html>`;
