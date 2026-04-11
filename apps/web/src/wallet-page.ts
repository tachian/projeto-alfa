import { escapeHtml } from "./html.js";
import { renderWalletHeaderScript, renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderWalletPage = (input: {
  appName: string;
  pathname: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Carteira | ${escapeHtml(input.appName)}</title>
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

      .hero,
      .panel {
        border-radius: 28px;
        border: 1px solid var(--line);
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(239, 246, 255, 0.88)),
          var(--panel);
        box-shadow: var(--shadow);
      }

      .hero {
        padding: 32px;
      }

      .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
        gap: 22px;
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
        font-size: clamp(2.5rem, 6vw, 4.3rem);
        line-height: 0.95;
        max-width: 10ch;
      }

      p {
        color: var(--muted);
        line-height: 1.7;
      }

      .identity-card,
      .summary-card,
      .guidance-card {
        padding: 18px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.76);
      }

      .identity-label,
      .summary-label {
        color: #64748b;
        font-size: 0.76rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .identity-value,
      .summary-value {
        margin-top: 8px;
        font-weight: 700;
      }

      .identity-meta,
      .summary-note {
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

      .panel {
        margin-top: 22px;
        padding: 24px;
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

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-top: 18px;
      }

      .guidance-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 18px;
      }

      .summary-value {
        font-size: 1.85rem;
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

      .action-links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      .action-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 10px 16px;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 700;
        color: var(--ink);
        background: rgba(15, 23, 42, 0.06);
      }

      .action-link.primary {
        color: white;
        background: linear-gradient(135deg, var(--accent), #0f766e);
      }

      @media (max-width: 980px) {
        .hero-grid,
        .summary-grid,
        .guidance-grid {
          grid-template-columns: 1fr;
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
            <div class="eyebrow">Carteira</div>
            <h1>Saldo, reserva e extrato em uma tela so.</h1>
            <p>Aqui voce acompanha o disponivel para operar, o valor reservado em ordens abertas e o historico contabio da sua carteira.</p>
          </div>
          <aside class="identity-card">
            <div class="identity-label">Sessao</div>
            <div id="identity-name" class="identity-value">Validando sessao...</div>
            <div id="identity-meta" class="identity-meta">Esta area exige autenticacao do usuario.</div>
            <div class="identity-actions">
              <button id="logout-button" type="button">Sair</button>
            </div>
          </aside>
        </div>
      </section>

      <section class="panel">
        <div class="eyebrow">Wallet</div>
        <h2>Resumo financeiro</h2>
        <p>Use a carteira como trilha financeira do portal antes e depois das operacoes de trading.</p>

        <div id="wallet-status" class="status">Carregando saldo e extrato...</div>

        <div class="summary-grid">
          <article class="summary-card">
            <div class="summary-label">Disponivel</div>
            <div id="wallet-available" class="summary-value">-</div>
            <div id="wallet-available-note" class="summary-note">Saldo pronto para operar e sacar</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Reservado</div>
            <div id="wallet-reserved" class="summary-value">-</div>
            <div id="wallet-reserved-note" class="summary-note">Valor bloqueado em ordens abertas</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Total</div>
            <div id="wallet-total" class="summary-value">-</div>
            <div id="wallet-currency" class="summary-note">Moeda da carteira</div>
          </article>
        </div>

        <div class="guidance-grid">
          <article class="guidance-card">
            <div class="eyebrow">Disponivel</div>
            <h2 style="margin-top: 10px;">Pode ser usado agora</h2>
            <p>O saldo disponivel pode seguir para novas ordens, deposito compensado em carteira ou solicitacao de saque.</p>
          </article>
          <article class="guidance-card">
            <div class="eyebrow">Reservado</div>
            <h2 style="margin-top: 10px;">Fica preso ao book</h2>
            <p>Quando voce abre ordens, parte do capital vai para reservado. Esse valor nao entra no saque ate a ordem ser executada ou cancelada.</p>
          </article>
        </div>

        <div class="table-wrap">
          <div id="wallet-entries" class="empty-state">Carregando extrato...</div>
        </div>

        <div class="action-links">
          <a class="action-link primary" href="/payments/deposit">Depositar</a>
          <a class="action-link" href="/payments/withdraw">Sacar</a>
          <a class="action-link" href="/payments/history">Historico financeiro</a>
          <a class="action-link" href="/markets">Explorar mercados</a>
          <a class="action-link" href="/orders">Ver ordens</a>
          <a class="action-link" href="/portfolio/positions">Abrir portfolio</a>
        </div>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}
      ${renderWalletHeaderScript()}

      const sessionClient = window.ProjetoAlfaWebSession;
      const identityName = document.getElementById("identity-name");
      const identityMeta = document.getElementById("identity-meta");
      const logoutButton = document.getElementById("logout-button");
      const walletStatus = document.getElementById("wallet-status");
      const walletAvailable = document.getElementById("wallet-available");
      const walletAvailableNote = document.getElementById("wallet-available-note");
      const walletReserved = document.getElementById("wallet-reserved");
      const walletReservedNote = document.getElementById("wallet-reserved-note");
      const walletTotal = document.getElementById("wallet-total");
      const walletCurrency = document.getElementById("wallet-currency");
      const walletEntries = document.getElementById("wallet-entries");

      const setStatus = (message, tone = "default") => {
        walletStatus.dataset.tone = tone;
        walletStatus.textContent = message;
      };

      const formatAmount = (value, currency) => {
        const amount = Number(value || 0);
        const normalized = Number.isFinite(amount) ? amount.toFixed(2) : String(value || "0.00");
        return currency ? normalized + " " + currency : normalized;
      };

      const formatTimestamp = (value) => {
        if (!value) {
          return "n/d";
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
      };

      const paintIdentity = (user) => {
        identityName.textContent = user.name || user.email;
        identityMeta.textContent = [user.email, user.phone || "telefone em breve", user.status].join(" • ");
      };

      const paintBalance = (balance) => {
        const available = Number(balance.available || 0);
        const reserved = Number(balance.reserved || 0);
        walletAvailable.textContent = formatAmount(balance.available, balance.currency);
        walletReserved.textContent = formatAmount(balance.reserved, balance.currency);
        walletTotal.textContent = formatAmount(balance.total, balance.currency);
        walletCurrency.textContent = "Contas em " + (balance.currency || "BRL");
        walletAvailableNote.textContent = available > 0
          ? "Saldo pronto para operar ou solicitar saque."
          : "Sem saldo disponivel no momento.";
        walletReservedNote.textContent = reserved > 0
          ? "Parte do capital esta comprometida com ordens abertas."
          : "Nao ha saldo reservado em ordens no momento.";
      };

      const renderEntries = (entries, currency) => {
        if (!entries.length) {
          walletEntries.innerHTML = '<div class="empty-state">Ainda nao ha movimentacoes financeiras registradas na sua carteira.</div>';
          return;
        }

        walletEntries.innerHTML = [
          "<table>",
            "<thead><tr><th>Tipo</th><th>Debito</th><th>Credito</th><th>Conta</th><th>Referencia</th><th>Data</th></tr></thead>",
            "<tbody>",
              entries.map((entry) => (
                "<tr>" +
                  "<td>" + (entry.entryType || "-") + "</td>" +
                  "<td>" + formatAmount(entry.debitAmount || "0", currency) + "</td>" +
                  "<td>" + formatAmount(entry.creditAmount || "0", currency) + "</td>" +
                  "<td>" + (entry.accountType || "-") + "</td>" +
                  "<td>" + (entry.referenceType || "-") + "</td>" +
                  "<td>" + formatTimestamp(entry.createdAt) + "</td>" +
                "</tr>"
              )).join(""),
            "</tbody>",
          "</table>",
        ].join("");
      };

      const loadWallet = async () => {
        setStatus("Carregando saldo e extrato...");

        try {
          const [user, balancePayload, entriesPayload] = await Promise.all([
            sessionClient.resolveUser(),
            sessionClient.fetchJsonWithAuth("/api/wallet/balance", { method: "GET" }, "Nao foi possivel carregar seu saldo."),
            sessionClient.fetchJsonWithAuth("/api/wallet/entries?limit=100", { method: "GET" }, "Nao foi possivel carregar seu extrato."),
          ]);

          paintIdentity(user);
          paintBalance(balancePayload.balance);
          renderEntries(Array.isArray(entriesPayload?.entries) ? entriesPayload.entries : [], balancePayload.balance.currency);
          setStatus("Carteira atualizada com sucesso.", "success");
        } catch (error) {
          if (error?.code === "unauthenticated") {
            sessionClient.redirectToLogin("expired");
            return;
          }

          walletAvailable.textContent = "-";
          walletReserved.textContent = "-";
          walletTotal.textContent = "-";
          walletEntries.innerHTML = '<div class="empty-state">Nao foi possivel carregar o extrato da carteira.</div>';
          setStatus(error?.message || "Nao foi possivel carregar a carteira.", "danger");
        }
      };

      logoutButton.addEventListener("click", () => {
        sessionClient.logout();
      });

      loadWallet();
    </script>
  </body>
</html>`;
