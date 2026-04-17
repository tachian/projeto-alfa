import { renderAdminChromeStyles, renderAdminNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderPortfolioSettlementsPage = (input: {
  appName: string;
  pathname: string;
}) => {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Liquidacoes | ${input.appName}</title>
    <style>
      :root {
        --bg: #f4efe6;
        --panel: rgba(255, 251, 245, 0.9);
        --ink: #1b1510;
        --muted: #6d5f4f;
        --line: rgba(50, 34, 19, 0.14);
        --accent: #b14d2d;
        --success: #276749;
        --danger: #9b2c2c;
        --shadow: 0 24px 80px rgba(68, 42, 18, 0.14);
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(241, 196, 161, 0.55), transparent 30%),
          radial-gradient(circle at top right, rgba(222, 139, 93, 0.32), transparent 24%),
          linear-gradient(180deg, #fbf6ee 0%, var(--bg) 52%, #efe2cf 100%);
      }

      .shell {
        width: calc(100% - 32px);
        margin: 0 auto;
        padding: 24px 0 64px;
      }

      ${renderAdminChromeStyles()}

      .hero, .panel {
        border-radius: 28px;
        border: 1px solid rgba(98, 60, 28, 0.12);
        background:
          linear-gradient(135deg, rgba(255, 251, 245, 0.96), rgba(248, 232, 214, 0.88)),
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
        font-size: 0.8rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--muted);
      }

      h1, h2 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        font-weight: 700;
        letter-spacing: -0.03em;
      }

      h1 {
        margin-top: 12px;
        font-size: clamp(2.3rem, 5vw, 4rem);
        line-height: 0.95;
      }

      p { color: var(--muted); line-height: 1.7; }

      .identity-card {
        min-width: 240px;
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.62);
      }

      .identity-label {
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
      }

      .identity-value {
        margin-top: 6px;
        font-weight: 700;
      }

      .identity-meta {
        margin-top: 4px;
        color: var(--muted);
        font-size: 0.92rem;
      }

      .identity-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 14px;
      }

      button {
        border: 0;
        cursor: pointer;
        padding: 11px 16px;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 600;
      }

      button.secondary {
        background: rgba(27, 21, 16, 0.08);
        color: var(--ink);
      }

      .status, .access-denied {
        margin-top: 18px;
        padding: 16px 18px;
        border-radius: 18px;
      }

      .status {
        background: rgba(177, 77, 45, 0.1);
        color: var(--accent);
      }

      .status[data-tone="success"] {
        background: rgba(39, 103, 73, 0.12);
        color: var(--success);
      }

      .status[data-tone="danger"] {
        background: rgba(155, 44, 44, 0.12);
        color: var(--danger);
      }

      .access-denied {
        border: 1px solid rgba(155, 44, 44, 0.14);
        background: rgba(155, 44, 44, 0.08);
        color: var(--danger);
      }

      .access-denied-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 16px;
      }

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

      .summary-card {
        padding: 18px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.62);
      }

      .summary-label {
        font-size: 0.78rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .summary-value {
        margin-top: 10px;
        font-size: 1.8rem;
        font-weight: 700;
        letter-spacing: -0.04em;
      }

      .summary-note {
        margin-top: 8px;
        font-size: 0.9rem;
        color: var(--muted);
      }

      .table-wrap {
        margin-top: 18px;
        overflow: auto;
        border-radius: 18px;
        border: 1px solid rgba(76, 51, 24, 0.08);
        background: rgba(255, 255, 255, 0.62);
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        padding: 12px 14px;
        text-align: left;
        border-bottom: 1px solid rgba(76, 51, 24, 0.08);
        font-size: 0.94rem;
      }

      th {
        color: var(--muted);
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        background: rgba(255, 248, 241, 0.98);
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
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      ${renderAdminNavigation({ appName: input.appName, pathname: input.pathname })}

      <section class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">Portfolio</div>
            <h1>Historico de liquidacoes</h1>
            <p>Veja os resultados dos settlements por mercado para acompanhar o fechamento dos contratos e reconciliar o comportamento da carteira.</p>
          </div>
          <aside class="identity-card">
            <div class="identity-label">Sessao</div>
            <div id="identity-email" class="identity-value">Nao autenticado</div>
            <div id="identity-meta" class="identity-meta">A area de portfolio valida a sessao ao carregar.</div>
            <div class="identity-actions">
              <button id="logout-button" type="button" class="secondary">Sair</button>
            </div>
          </aside>
        </div>
      </section>

      <section id="access-denied" class="access-denied" hidden>
        <div class="eyebrow">Acesso</div>
        <h2>Acesso restrito</h2>
        <p>Esta conta esta autenticada, mas nao possui a role administrativa necessaria para acessar esta area.</p>
        <div class="access-denied-actions">
          <button id="denied-switch-account" type="button" class="secondary">Trocar conta</button>
          <button id="denied-logout" type="button">Sair do painel</button>
        </div>
      </section>

      <section id="workspace-content" class="panel">
        <div class="eyebrow">Liquidacoes</div>
        <h2>Settlement por mercado</h2>
        <p>Esta grade mostra status, payout e delta de PnL realizado para acompanhar o ciclo final de cada contrato.</p>
        <div id="settlements-status" class="status">Validando sessao do admin...</div>
        <div class="summary-grid">
          <article class="summary-card">
            <div class="summary-label">Liquidacoes</div>
            <div id="settlements-total" class="summary-value">-</div>
            <div class="summary-note">Registros retornados pela consulta atual.</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Vitorias</div>
            <div id="settlements-won" class="summary-value">-</div>
            <div class="summary-note">Entradas marcadas como won.</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Derrotas</div>
            <div id="settlements-lost" class="summary-value">-</div>
            <div class="summary-note">Entradas marcadas como lost.</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Payout total</div>
            <div id="settlements-payout" class="summary-value">-</div>
            <div class="summary-note">Soma do payout dos registros exibidos.</div>
          </article>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mercado</th>
                <th>Outcome</th>
                <th>Direcao</th>
                <th>Contratos</th>
                <th>Payout</th>
                <th>Delta PnL</th>
                <th>Status</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody id="settlements-body">
              <tr><td colspan="8" class="empty-state">Carregando liquidacoes...</td></tr>
            </tbody>
          </table>
        </div>
        <p style="margin-top: 18px;"><a class="action-link" href="/portfolio/pnl">Voltar para resumo de PnL</a></p>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}

      const statusNode = document.getElementById("settlements-status");
      const settlementsBody = document.getElementById("settlements-body");

      const setStatus = (message, tone = "default") => {
        statusNode.hidden = false;
        statusNode.dataset.tone = tone;
        statusNode.textContent = message;
      };

      const assignSummaryValue = (id, value) => {
        document.getElementById(id).textContent = String(value);
      };

      const renderRows = (items) => {
        if (!items.length) {
          assignSummaryValue("settlements-total", 0);
          assignSummaryValue("settlements-won", 0);
          assignSummaryValue("settlements-lost", 0);
          assignSummaryValue("settlements-payout", "0.00");
          settlementsBody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhuma liquidacao encontrada para esta conta.</td></tr>';
          return;
        }

        const wonCount = items.filter((settlement) => settlement.status === "won").length;
        const lostCount = items.filter((settlement) => settlement.status === "lost").length;
        const totalPayout = items.reduce((sum, settlement) => sum + Number(settlement.payoutAmount ?? 0), 0);

        assignSummaryValue("settlements-total", items.length);
        assignSummaryValue("settlements-won", wonCount);
        assignSummaryValue("settlements-lost", lostCount);
        assignSummaryValue("settlements-payout", totalPayout.toFixed(2));

        settlementsBody.innerHTML = items
          .map((settlement) => {
            const marketTitle = settlement.market?.title ?? settlement.marketUuid;
            const createdAt = settlement.createdAt ? new Date(settlement.createdAt).toLocaleString("pt-BR") : "-";
            return \`<tr>
              <td>\${marketTitle}</td>
              <td>\${settlement.outcome}</td>
              <td>\${settlement.positionDirection ?? "-"}</td>
              <td>\${settlement.contractsSettled ?? "-"}</td>
              <td>\${settlement.payoutAmount ?? "-"}</td>
              <td>\${settlement.realizedPnlDelta ?? "-"}</td>
              <td>\${settlement.status ?? "-"}</td>
              <td>\${createdAt}</td>
            </tr>\`;
          })
          .join("");
      };

      const bootstrap = async () => {
        const deniedNode = document.getElementById("access-denied");
        const workspaceNode = document.getElementById("workspace-content");
        const identityEmail = document.getElementById("identity-email");
        const identityMeta = document.getElementById("identity-meta");
        const session = window.ProjetoAlfaSession;
        document.getElementById("logout-button").addEventListener("click", () => session.logout("logged-out"));
        document.getElementById("denied-switch-account").addEventListener("click", () => session.logout("switch-account"));
        document.getElementById("denied-logout").addEventListener("click", () => session.logout("logged-out"));

        try {
          const user = await session.resolveAdminUser();
          identityEmail.textContent = user.email;
          identityMeta.textContent = "Role: " + user.role + " • status: " + user.status;

          deniedNode.hidden = true;
          workspaceNode.hidden = false;

          setStatus("Consultando historico de liquidacoes...", "default");

          const payload = await session.fetchJsonWithAuth("/api/portfolio/settlements?limit=100", { method: "GET" }, "Falha ao carregar liquidacoes.");
          renderRows(payload.items ?? []);
          setStatus("Historico de liquidacoes carregado com sucesso.", "success");
        } catch (error) {
          const cachedUser = session.get()?.user;

          if (error?.code === "forbidden" && cachedUser) {
            workspaceNode.hidden = true;
            deniedNode.hidden = false;
            identityEmail.textContent = cachedUser.email;
            identityMeta.textContent = "Role: " + cachedUser.role + " • status: " + cachedUser.status;
            setStatus("Esta conta nao possui role administrativa para consultar liquidacoes.", "danger");
            return;
          }

          if (error?.code === "unauthenticated") {
            session.logout("expired");
            return;
          }

          const message = error instanceof Error ? error.message : "Falha inesperada ao carregar liquidacoes.";
          setStatus(message, "danger");
        }
      };

      bootstrap();
    </script>
  </body>
</html>`;
};
