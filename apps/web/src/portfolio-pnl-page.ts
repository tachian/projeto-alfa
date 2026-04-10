import { escapeHtml } from "./html.js";
import { renderWalletHeaderScript, renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderPortfolioPnlPage = (input: {
  appName: string;
  pathname: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PnL | ${escapeHtml(input.appName)}</title>
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

      .summary-card[data-tone="success"] {
        background: rgba(22, 101, 52, 0.1);
      }

      .summary-card[data-tone="danger"] {
        background: rgba(180, 35, 24, 0.08);
      }

      .summary-card[data-tone="accent"] {
        background: rgba(3, 105, 161, 0.08);
      }

      .summary-value {
        font-size: 2rem;
        letter-spacing: -0.04em;
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
            <h1>PnL consolidado</h1>
            <p>Veja o resumo financeiro da sua carteira em uma tela objetiva, separada da execucao de ordens e da exploracao de mercados.</p>
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
        <div class="eyebrow">PnL</div>
        <h2>Resumo da carteira</h2>
        <p>O painel abaixo resume resultado realizado, nao realizado, total e quantidade de posicoes abertas.</p>

        <div id="pnl-status" class="status">Carregando resumo de PnL...</div>

        <div class="summary-grid">
          <article class="summary-card">
            <div class="summary-label">Realizado</div>
            <div id="realized-pnl-card" class="summary-value">-</div>
            <div class="summary-note">PnL realizado da carteira</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Nao realizado</div>
            <div id="unrealized-pnl-card" class="summary-value">-</div>
            <div class="summary-note">Mark-to-market atual</div>
          </article>
          <article id="total-pnl-card" class="summary-card" data-tone="accent">
            <div class="summary-label">PnL total</div>
            <div id="total-pnl-value" class="summary-value">-</div>
            <div class="summary-note">Resultado consolidado</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Posicoes abertas</div>
            <div id="open-positions-card" class="summary-value">-</div>
            <div class="summary-note">Quantidade atual de posicoes abertas</div>
          </article>
        </div>

        <p id="pnl-empty-note" style="margin-top: 18px;"></p>
        <p style="margin-top: 18px;">
          <a class="action-link" href="/portfolio/positions">Abrir tabela de posicoes</a>
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
      const statusNode = document.getElementById("pnl-status");
      const realizedCard = document.getElementById("realized-pnl-card");
      const unrealizedCard = document.getElementById("unrealized-pnl-card");
      const totalCard = document.getElementById("total-pnl-card");
      const totalValue = document.getElementById("total-pnl-value");
      const openPositionsCard = document.getElementById("open-positions-card");
      const emptyNote = document.getElementById("pnl-empty-note");

      const setStatus = (message, tone = "default") => {
        statusNode.dataset.tone = tone;
        statusNode.textContent = message;
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

      const toneForPnl = (value) => {
        const number = toNumber(value);
        if (number > 0) return "success";
        if (number < 0) return "danger";
        return "accent";
      };

      const loadPnl = async () => {
        setStatus("Carregando resumo de PnL...");

        try {
          const payload = await session.fetchJsonWithAuth("/api/portfolio/pnl", { method: "GET" }, "Nao foi possivel carregar o resumo de PnL.");
          const summary = payload?.summary ?? {
            realizedPnl: "0",
            unrealizedPnl: "0",
            totalPnl: "0",
            openPositions: 0,
          };

          realizedCard.textContent = formatMoney(summary.realizedPnl);
          unrealizedCard.textContent = formatMoney(summary.unrealizedPnl);
          totalValue.textContent = formatMoney(summary.totalPnl);
          openPositionsCard.textContent = String(summary.openPositions ?? 0);
          totalCard.dataset.tone = toneForPnl(summary.totalPnl);
          emptyNote.textContent = summary.openPositions
            ? ""
            : "Nao ha posicoes abertas neste momento.";
          setStatus("Resumo de PnL carregado com sucesso.", "success");
        } catch (error) {
          if (error?.code === "unauthenticated") {
            session.redirectToLogin("expired");
            return;
          }

          realizedCard.textContent = "-";
          unrealizedCard.textContent = "-";
          totalValue.textContent = "-";
          openPositionsCard.textContent = "-";
          emptyNote.textContent = "";
          setStatus(error?.message || "Nao foi possivel carregar o resumo de PnL.", "danger");
        }
      };

      logoutButton.addEventListener("click", () => {
        session.logout("logged-out");
      });

      session.resolveUser()
        .then((user) => {
          paintIdentity(user);
          return loadPnl();
        })
        .catch(() => {
          session.redirectToLogin("protected");
        });
    </script>
  </body>
</html>`;
