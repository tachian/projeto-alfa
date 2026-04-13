import { escapeHtml } from "./html.js";
import { renderWalletHeaderScript, renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderPaymentsHistoryPage = (input: {
  appName: string;
  pathname: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Historico financeiro | ${escapeHtml(input.appName)}</title>
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
        --warning: #8a5b17;
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

      .hero { padding: 32px; }

      .hero-grid,
      .content-grid,
      .summary-grid,
      .field-grid {
        display: grid;
        gap: 20px;
      }

      .hero-grid {
        grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
      }

      .content-grid {
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
        align-items: start;
      }

      .summary-grid,
      .field-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
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
        font-size: clamp(2.4rem, 5vw, 4rem);
        line-height: 0.95;
        max-width: 11ch;
      }

      p, li {
        color: var(--muted);
        line-height: 1.7;
      }

      .identity-card,
      .summary-card,
      .filters-card,
      .table-card {
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

      .identity-actions button,
      .filters-actions button {
        border: 0;
        border-radius: 999px;
        padding: 12px 16px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .identity-actions button {
        background: rgba(15, 23, 42, 0.06);
        color: var(--ink);
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
      .status[data-tone="warning"] { color: var(--warning); background: rgba(138, 91, 23, 0.1); }

      .summary-value {
        font-size: 1.6rem;
        letter-spacing: -0.04em;
      }

      form {
        display: grid;
        gap: 16px;
      }

      label {
        display: grid;
        gap: 8px;
        color: var(--muted);
        font-size: 0.95rem;
      }

      input,
      select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 14px 16px;
        font: inherit;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.92);
      }

      .filters-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }

      .filters-actions button {
        color: white;
        background: linear-gradient(135deg, #0369a1, #0f766e);
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

      .type-chip,
      .status-chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 6px 10px;
        font-weight: 700;
        font-size: 0.8rem;
      }

      .type-chip[data-type="deposit"] {
        background: rgba(22, 101, 52, 0.1);
        color: var(--success);
      }

      .type-chip[data-type="withdrawal"] {
        background: rgba(138, 91, 23, 0.12);
        color: var(--warning);
      }

      .status-chip[data-status="completed"] {
        background: rgba(22, 101, 52, 0.1);
        color: var(--success);
      }

      .status-chip[data-status="pending"] {
        background: rgba(3, 105, 161, 0.1);
        color: var(--accent);
      }

      .status-chip:not([data-status="completed"]):not([data-status="pending"]) {
        background: rgba(180, 35, 24, 0.08);
        color: var(--danger);
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
        background: linear-gradient(135deg, #0369a1, #0f766e);
      }

      @media (max-width: 980px) {
        .hero-grid,
        .content-grid,
        .summary-grid,
        .field-grid {
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
            <div class="eyebrow">Movimentacoes</div>
            <h1>Historico financeiro em uma trilha unica.</h1>
            <p>Aqui voce acompanha depositos e saques por tipo, status e moeda sem misturar conciliacao financeira com ordens, carteira e portfolio.</p>
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
        <div class="eyebrow">Historico</div>
        <h2>Depositos e saques combinados</h2>
        <p>Use filtros simples para revisar o fluxo financeiro da conta, acompanhar status e identificar rapidamente qual movimento entrou ou saiu da carteira.</p>

        <div id="history-status" class="status">Carregando historico financeiro...</div>

        <div class="summary-grid" style="margin-top: 18px;">
          <article class="summary-card">
            <div class="summary-label">Movimentacoes</div>
            <div id="summary-total" class="summary-value">-</div>
            <div class="summary-note">Total de registros carregados</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Depositos</div>
            <div id="summary-deposits" class="summary-value">-</div>
            <div class="summary-note">Entradas no periodo atual</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Saques</div>
            <div id="summary-withdrawals" class="summary-value">-</div>
            <div class="summary-note">Saidas no periodo atual</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Volume</div>
            <div id="summary-volume" class="summary-value">-</div>
            <div id="summary-currency" class="summary-note">Moeda dos filtros</div>
          </article>
        </div>

        <div class="content-grid" style="margin-top: 18px;">
          <article class="filters-card">
            <div class="eyebrow">Filtros</div>
            <h2>Refinar leitura</h2>
            <p>Voce pode combinar tipo, moeda e limite para reduzir ruido e revisar um subconjunto do historico financeiro.</p>

            <form id="history-filters-form">
              <div class="field-grid">
                <label>
                  Tipo
                  <select id="filter-type" name="type">
                    <option value="">Todos</option>
                    <option value="deposit">Depositos</option>
                    <option value="withdrawal">Saques</option>
                  </select>
                </label>

                <label>
                  Moeda
                  <input id="filter-currency" name="currency" type="text" value="USD" maxlength="3" />
                </label>

                <label>
                  Limite
                  <input id="filter-limit" name="limit" type="number" min="1" max="100" value="20" />
                </label>
              </div>

              <div class="filters-actions">
                <div id="filters-inline-status" class="summary-note">Use os filtros para carregar um recorte do historico.</div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  <button id="filters-reset" type="button" style="background: rgba(15, 23, 42, 0.08); color: var(--ink);">Limpar filtros</button>
                  <button type="submit">Atualizar historico</button>
                </div>
              </div>
            </form>

            <div class="action-links">
              <a class="action-link primary" href="/payments/deposit">Novo deposito</a>
              <a class="action-link" href="/payments/withdraw">Novo saque</a>
              <a class="action-link" href="/wallet">Abrir carteira</a>
            </div>
          </article>

          <article class="table-card">
            <div class="eyebrow">Movimentacoes</div>
            <h2>Linha do tempo financeira</h2>
            <div class="table-wrap">
              <div id="payments-table" class="empty-state">Carregando movimentacoes...</div>
            </div>
          </article>
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
      const historyStatus = document.getElementById("history-status");
      const filtersInlineStatus = document.getElementById("filters-inline-status");
      const filtersForm = document.getElementById("history-filters-form");
      const filtersResetButton = document.getElementById("filters-reset");
      const typeInput = document.getElementById("filter-type");
      const currencyInput = document.getElementById("filter-currency");
      const limitInput = document.getElementById("filter-limit");
      const summaryTotal = document.getElementById("summary-total");
      const summaryDeposits = document.getElementById("summary-deposits");
      const summaryWithdrawals = document.getElementById("summary-withdrawals");
      const summaryVolume = document.getElementById("summary-volume");
      const summaryCurrency = document.getElementById("summary-currency");
      const paymentsTable = document.getElementById("payments-table");

      const setStatus = (message, tone = "default") => {
        historyStatus.dataset.tone = tone;
        historyStatus.textContent = message;
      };

      const setInlineStatus = (message) => {
        filtersInlineStatus.textContent = message;
      };

      const paintIdentity = (user) => {
        identityName.textContent = user.name || user.email;
        identityMeta.textContent = [user.email, user.phone || "telefone em breve", user.status].join(" • ");
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

      const validateFilters = () => {
        const currency = currencyInput.value.trim().toUpperCase();
        const limit = Number(limitInput.value);

        if (currency.length !== 3) {
          return "Informe uma moeda com 3 letras.";
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
          return "O limite deve ser um numero inteiro entre 1 e 100.";
        }

        return "";
      };

      const syncFiltersFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        typeInput.value = params.get("type") || "";
        currencyInput.value = (params.get("currency") || "USD").toUpperCase();
        limitInput.value = params.get("limit") || "20";
      };

      const buildQuery = () => {
        const params = new URLSearchParams();
        const currency = currencyInput.value.trim().toUpperCase();
        const limit = limitInput.value.trim();
        const type = typeInput.value.trim();

        if (currency) {
          params.set("currency", currency);
        }
        if (limit) {
          params.set("limit", limit);
        }
        if (type) {
          params.set("type", type);
        }

        return params;
      };

      const paintSummary = (items, currency) => {
        const deposits = items.filter((item) => item.type === "deposit");
        const withdrawals = items.filter((item) => item.type === "withdrawal");
        const totalVolume = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

        summaryTotal.textContent = String(items.length);
        summaryDeposits.textContent = String(deposits.length);
        summaryWithdrawals.textContent = String(withdrawals.length);
        summaryVolume.textContent = formatAmount(String(totalVolume), currency);
        summaryCurrency.textContent = "Moeda dos filtros: " + currency;
      };

      const renderTable = (items, currency) => {
        if (!items.length) {
          paymentsTable.innerHTML = '<div class="empty-state">Nenhuma movimentacao encontrada com os filtros atuais. Tente ampliar o limite, trocar a moeda ou limpar os filtros para voltar ao historico completo.</div>';
          return;
        }

        paymentsTable.innerHTML = [
          "<table>",
            "<thead><tr><th>Tipo</th><th>Status</th><th>Valor</th><th>Moeda</th><th>Provedor</th><th>Descricao</th><th>Processado</th><th>Criado em</th></tr></thead>",
            "<tbody>",
              items.map((item) => (
                "<tr>" +
                  "<td><span class=\\"type-chip\\" data-type=\\"" + item.type + "\\">" + item.type + "</span></td>" +
                  "<td><span class=\\"status-chip\\" data-status=\\"" + item.status + "\\">" + item.status + "</span></td>" +
                  "<td>" + formatAmount(item.amount, currency) + "</td>" +
                  "<td>" + item.currency + "</td>" +
                  "<td>" + (item.provider || "-") + "</td>" +
                  "<td>" + (item.description || "-") + "</td>" +
                  "<td>" + formatTimestamp(item.processedAt) + "</td>" +
                  "<td>" + formatTimestamp(item.createdAt) + "</td>" +
                "</tr>"
              )).join(""),
            "</tbody>",
          "</table>",
        ].join("");
      };

      const loadHistory = async () => {
        const validationMessage = validateFilters();
        if (validationMessage) {
          setStatus(validationMessage, "danger");
          return;
        }

        const query = buildQuery();
        const queryString = query.toString();
        const currency = query.get("currency") || "USD";
        const requestedType = query.get("type") || "";
        const limit = query.get("limit") || "20";

        const nextUrl = new URL(window.location.href);
        nextUrl.search = queryString;
        window.history.replaceState({}, "", nextUrl.toString());

        setStatus("Carregando historico financeiro...");
        setInlineStatus("Buscando registros de deposito e saque...");

        try {
          const requestTargets = requestedType
            ? [requestedType]
            : ["deposit", "withdrawal"];

          const [user, ...responses] = await Promise.all([
            sessionClient.resolveUser(),
            ...requestTargets.map((type) => {
              const endpoint = type === "deposit" ? "/api/payments/deposits" : "/api/payments/withdrawals";
              return sessionClient.fetchJsonWithAuth(
                endpoint + "?currency=" + encodeURIComponent(currency) + "&limit=" + encodeURIComponent(limit),
                { method: "GET" },
                "Nao foi possivel carregar o historico financeiro.",
              );
            }),
          ]);

          paintIdentity(user);

          const items = responses
            .flatMap((payload) => Array.isArray(payload?.items) ? payload.items : [])
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

          paintSummary(items, currency);
          renderTable(items, currency);
          setStatus(items.length ? "Historico atualizado com sucesso." : "Nenhuma movimentacao encontrada para os filtros atuais.", items.length ? "success" : "warning");
          setInlineStatus("Filtro atual: " + (requestedType || "todos os tipos") + " • moeda " + currency);
        } catch (error) {
          if (error?.code === "unauthenticated") {
            sessionClient.redirectToLogin("expired");
            return;
          }

          paintSummary([], currency);
          paymentsTable.innerHTML = '<div class="empty-state">Nao foi possivel carregar o historico financeiro agora.</div>';
          setStatus(error?.message || "Nao foi possivel carregar o historico financeiro.", "danger");
          setInlineStatus("Revise filtros ou tente novamente em instantes.");
        }
      };

      logoutButton.addEventListener("click", () => {
        sessionClient.logout();
      });

      filtersForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await loadHistory();
      });

      filtersResetButton.addEventListener("click", async () => {
        typeInput.value = "";
        currencyInput.value = "USD";
        limitInput.value = "20";
        setInlineStatus("Filtros resetados para o recorte padrao do historico.");
        await loadHistory();
      });

      syncFiltersFromUrl();
      loadHistory();
    </script>
  </body>
</html>`;
