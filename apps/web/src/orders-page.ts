import { escapeHtml } from "./html.js";
import { renderWalletHeaderScript, renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderOrdersPage = (input: {
  appName: string;
  pathname: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ordens | ${escapeHtml(input.appName)}</title>
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

      .hero { padding: 32px; }

      .hero-grid,
      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
        gap: 22px;
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
        max-width: 12ch;
      }

      p {
        color: var(--muted);
        line-height: 1.7;
      }

      .identity-card,
      .summary-card,
      .filters-card,
      .table-card {
        padding: 20px;
        border-radius: 22px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.78);
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

      .identity-meta {
        margin-top: 6px;
        color: var(--muted);
      }

      .identity-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
      }

      .identity-actions button,
      .filters-actions button,
      .cancel-button {
        border: 0;
        border-radius: 999px;
        padding: 10px 14px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .identity-actions button,
      .cancel-button {
        background: rgba(15, 23, 42, 0.06);
        color: var(--ink);
      }

      .panel {
        margin-top: 22px;
        padding: 28px;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 18px;
      }

      .content-grid {
        align-items: start;
      }

      form {
        display: grid;
        gap: 16px;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
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
        gap: 12px;
        flex-wrap: wrap;
      }

      .filters-actions button {
        color: white;
        background: linear-gradient(135deg, var(--accent), #0f766e);
      }

      .status {
        min-height: 24px;
        color: var(--muted);
      }

      .status[data-tone="success"] { color: var(--success); }
      .status[data-tone="danger"] { color: var(--danger); }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
      }

      th, td {
        padding: 12px 0;
        border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        text-align: left;
        font-size: 0.94rem;
      }

      .stack {
        display: grid;
        gap: 18px;
      }

      .empty-state {
        margin-top: 14px;
        padding: 18px;
        border-radius: 18px;
        background: rgba(3, 105, 161, 0.08);
        color: #0369a1;
      }

      .quick-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-top: 16px;
        border-radius: 999px;
        padding: 12px 16px;
        background: rgba(15, 23, 42, 0.06);
        color: var(--ink);
        text-decoration: none;
        font-weight: 700;
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
            <div class="eyebrow">Ordens</div>
            <h1>Seu trilho operacional no portal.</h1>
            <p>Acompanhe ordens abertas, parcialmente executadas, executadas e canceladas sem depender do painel administrativo.</p>
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
        <div class="summary-grid">
          <article class="summary-card">
            <div class="summary-label">Total</div>
            <div id="summary-total" class="summary-value">-</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Abertas</div>
            <div id="summary-open" class="summary-value">-</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Finalizadas</div>
            <div id="summary-completed" class="summary-value">-</div>
          </article>
        </div>

        <div class="content-grid">
          <article class="filters-card">
            <div class="eyebrow">Filtros</div>
            <h2>Refinar consulta</h2>
            <p>Use filtros simples por mercado, status e quantidade de registros para navegar melhor pelo seu historico operacional.</p>

            <form id="orders-filters-form">
              <div class="field-grid">
                <label>
                  Market UUID
                  <input id="filter-market-uuid" name="marketUuid" type="text" placeholder="Opcional" />
                </label>

                <label>
                  Status
                  <select id="filter-status" name="status">
                    <option value="">Todos</option>
                    <option value="open">Open</option>
                    <option value="partially_filled">Partially filled</option>
                    <option value="filled">Filled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>

                <label>
                  Limite
                  <input id="filter-limit" name="limit" type="number" min="1" max="100" value="20" />
                </label>
              </div>

              <div class="filters-actions">
                <div id="orders-status" class="status">Validando sessao antes de carregar suas ordens...</div>
                <button type="submit">Atualizar lista</button>
              </div>
            </form>

            <a class="quick-link" href="/markets">Explorar mercados para abrir nova ordem</a>
          </article>

          <div class="stack">
            <article class="table-card">
              <div class="eyebrow">Historico operacional</div>
              <h2>Ordens do usuario</h2>
              <div id="orders-table">Carregando ordens...</div>
            </article>
          </div>
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
      const ordersStatus = document.getElementById("orders-status");
      const ordersTable = document.getElementById("orders-table");
      const filtersForm = document.getElementById("orders-filters-form");
      const marketUuidInput = document.getElementById("filter-market-uuid");
      const statusInput = document.getElementById("filter-status");
      const limitInput = document.getElementById("filter-limit");
      const summaryTotal = document.getElementById("summary-total");
      const summaryOpen = document.getElementById("summary-open");
      const summaryCompleted = document.getElementById("summary-completed");

      const setStatus = (message, tone = "default") => {
        ordersStatus.dataset.tone = tone;
        ordersStatus.textContent = message;
      };

      const paintIdentity = (user) => {
        identityName.textContent = user.name || user.email;
        identityMeta.textContent = [user.email, user.phone || "telefone em breve", user.status].join(" • ");
      };

      const syncFiltersFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        marketUuidInput.value = params.get("marketUuid") || "";
        statusInput.value = params.get("status") || "";
        limitInput.value = params.get("limit") || "20";
      };

      const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

      const buildOrdersQuery = () => {
        const params = new URLSearchParams();
        const marketUuid = marketUuidInput.value.trim();
        const status = statusInput.value.trim();
        const limit = limitInput.value.trim();

        if (marketUuid) {
          params.set("marketUuid", marketUuid);
        }
        if (status) {
          params.set("status", status);
        }
        if (limit) {
          params.set("limit", limit);
        }

        return params;
      };

      const validateFilters = () => {
        const marketUuid = marketUuidInput.value.trim();
        const limit = Number(limitInput.value);

        if (marketUuid && !isUuid(marketUuid)) {
          return "Filtro de mercado invalido. Informe um UUID valido.";
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
          return "O limite deve ser um numero inteiro entre 1 e 100.";
        }

        return "";
      };

      const formatTimestamp = (value) => {
        if (!value) {
          return "n/d";
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
      };

      const paintSummary = (orders) => {
        const openStatuses = new Set(["open", "partially_filled"]);
        summaryTotal.textContent = String(orders.length);
        summaryOpen.textContent = String(orders.filter((order) => openStatuses.has(order.status)).length);
        summaryCompleted.textContent = String(
          orders.filter((order) => ["filled", "cancelled"].includes(order.status)).length,
        );
      };

      const renderOrdersTable = (orders) => {
        if (!orders.length) {
          ordersTable.innerHTML = '<div class="empty-state">Nenhuma ordem encontrada com os filtros atuais.</div>';
          return;
        }

        ordersTable.innerHTML = [
          "<table>",
            "<thead><tr><th>Mercado</th><th>Lado</th><th>Outcome</th><th>Status</th><th>Preco</th><th>Qtd</th><th>Restante</th><th>Criada em</th><th>Acao</th></tr></thead>",
            "<tbody>",
              orders.map((order) => {
                const canCancel = ["open", "partially_filled"].includes(order.status);
                return (
                  "<tr>" +
                    "<td><a href=\\"/markets/" + order.marketUuid + "\\">" + (order.market?.title || order.marketUuid) + "</a></td>" +
                    "<td>" + order.side + "</td>" +
                    "<td>" + order.outcome + "</td>" +
                    "<td>" + order.status + "</td>" +
                    "<td>" + order.price + "</td>" +
                    "<td>" + order.quantity + "</td>" +
                    "<td>" + order.remainingQuantity + "</td>" +
                    "<td>" + formatTimestamp(order.createdAt) + "</td>" +
                    "<td>" + (
                      canCancel
                        ? "<button class=\\"cancel-button\\" data-order-uuid=\\"" + order.uuid + "\\">Cancelar</button>"
                        : "-"
                    ) + "</td>" +
                  "</tr>"
                );
              }).join(""),
            "</tbody>",
          "</table>",
        ].join("");

        ordersTable.querySelectorAll("[data-order-uuid]").forEach((button) => {
          button.addEventListener("click", async () => {
            button.disabled = true;
            setStatus("Cancelando ordem selecionada...");

            try {
              await sessionClient.fetchJsonWithAuth("/api/orders/" + button.dataset.orderUuid + "/cancel", {
                method: "POST",
              }, "Nao foi possivel cancelar a ordem.");

              setStatus("Ordem cancelada com sucesso.", "success");
              await loadOrders();
            } catch (error) {
              if (error?.code === "unauthenticated") {
                sessionClient.redirectToLogin("expired");
                return;
              }

              button.disabled = false;
              setStatus(error?.message || "Nao foi possivel cancelar a ordem.", "danger");
            }
          });
        });
      };

      const loadOrders = async () => {
        const query = buildOrdersQuery();
        const queryString = query.toString();
        const requestUrl = "/api/orders" + (queryString ? "?" + queryString : "");

        const nextUrl = new URL(window.location.href);
        nextUrl.search = queryString;
        window.history.replaceState({}, "", nextUrl.toString());

        setStatus("Carregando suas ordens...");

        try {
          const payload = await sessionClient.fetchJsonWithAuth(requestUrl, {
            method: "GET",
          }, "Nao foi possivel carregar suas ordens.");

          const orders = Array.isArray(payload?.items) ? payload.items : [];
          paintSummary(orders);
          renderOrdersTable(orders);
          setStatus("Lista atualizada com sucesso.");
        } catch (error) {
          if (error?.code === "unauthenticated") {
            sessionClient.redirectToLogin("expired");
            return;
          }

          paintSummary([]);
          ordersTable.innerHTML = '<div class="empty-state">Nao foi possivel carregar suas ordens agora.</div>';
          setStatus(error?.message || "Nao foi possivel carregar suas ordens.", "danger");
        }
      };

      logoutButton.addEventListener("click", () => {
        sessionClient.logout("logged-out");
      });

      filtersForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const validationMessage = validateFilters();
        if (validationMessage) {
          setStatus(validationMessage, "danger");
          return;
        }

        await loadOrders();
      });

      syncFiltersFromUrl();

      sessionClient.resolveUser()
        .then((user) => {
          paintIdentity(user);
          return loadOrders();
        })
        .catch(() => {
          sessionClient.redirectToLogin("protected");
        });
    </script>
  </body>
</html>`;
