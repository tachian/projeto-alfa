import { renderAdminChromeStyles, renderAdminNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderTradingOrdersPage = (input: {
  appName: string;
  pathname: string;
}) => {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ordens | ${input.appName}</title>
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
        width: min(1240px, calc(100% - 32px));
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

      .hero {
        padding: 32px;
      }

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

      button, input, select {
        font: inherit;
      }

      button {
        border: 0;
        cursor: pointer;
        padding: 11px 16px;
        border-radius: 999px;
        background: var(--accent);
        color: white;
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

      .filters {
        display: grid;
        grid-template-columns: 1.2fr 1fr auto;
        gap: 12px;
        margin-top: 18px;
      }

      input, select {
        width: 100%;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(76, 51, 24, 0.12);
        background: rgba(255, 255, 255, 0.78);
        color: var(--ink);
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
        .hero-top, .filters {
          grid-template-columns: 1fr;
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
            <div class="eyebrow">Trading</div>
            <h1>Ordens do usuario</h1>
            <p>Liste ordens abertas e recentes em uma tela dedicada, com filtros simples e cancelamento operacional.</p>
          </div>
          <aside class="identity-card">
            <div class="identity-label">Sessao</div>
            <div id="identity-email" class="identity-value">Nao autenticado</div>
            <div id="identity-meta" class="identity-meta">A area de ordens valida a sessao ao carregar.</div>
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
        <div class="eyebrow">Filtros</div>
        <h2>Ordens abertas e recentes</h2>
        <div class="filters">
          <input id="market-filter" placeholder="Filtrar por market UUID" />
          <select id="status-filter">
            <option value="">Todos os status</option>
            <option value="open">open</option>
            <option value="partially_filled">partially_filled</option>
            <option value="filled">filled</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button id="apply-filters" type="button">Atualizar</button>
        </div>
        <div id="orders-status" class="status">Validando sessao do admin...</div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mercado</th>
                <th>Lado</th>
                <th>Outcome</th>
                <th>Status</th>
                <th>Preco</th>
                <th>Qtd</th>
                <th>Restante</th>
                <th>Criada em</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody id="orders-body">
              <tr><td colspan="9" class="empty-state">Carregando ordens...</td></tr>
            </tbody>
          </table>
        </div>
        <p style="margin-top: 18px;"><a class="action-link" href="/trading/new">Enviar nova ordem</a></p>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}

      const statusNode = document.getElementById("orders-status");
      const ordersBody = document.getElementById("orders-body");
      const marketFilter = document.getElementById("market-filter");
      const statusFilter = document.getElementById("status-filter");

      const setStatus = (message, tone = "default") => {
        statusNode.textContent = message;
        statusNode.dataset.tone = tone;
      };

      const setIdentity = (input) => {
        document.getElementById("identity-email").textContent = input.email;
        document.getElementById("identity-meta").textContent = input.meta;
      };

      const redirectToLogin = (reason = "") => {
        window.location.href = window.ProjetoAlfaSession.buildLoginRedirectUrl(reason);
      };

      const logout = () => window.ProjetoAlfaSession.logout("logged-out");
      const switchAccount = () => window.ProjetoAlfaSession.logout("switch-account");

      const showAccessDenied = (user) => {
        document.getElementById("workspace-content").hidden = true;
        document.getElementById("access-denied").hidden = false;
        setIdentity({
          email: user.email,
          meta: "Role: " + user.role + " | Status: " + user.status,
        });
        setStatus("Acesso restrito a administradores.", "danger");
      };

      const renderOrders = (items) => {
        if (!items.length) {
          ordersBody.innerHTML = '<tr><td colspan="9" class="empty-state">Nenhuma ordem encontrada para os filtros atuais.</td></tr>';
          return;
        }

        ordersBody.innerHTML = items.map((order) => \`
          <tr>
            <td><a class="action-link" href="/markets/\${order.marketUuid}">\${order.market.title}</a></td>
            <td>\${order.side}</td>
            <td>\${order.outcome}</td>
            <td>\${order.status}</td>
            <td>\${order.price}c</td>
            <td>\${order.quantity}</td>
            <td>\${order.remainingQuantity}</td>
            <td>\${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}</td>
            <td>\${order.status === "open" || order.status === "partially_filled"
              ? '<button type="button" data-order-uuid="' + order.uuid + '">Cancelar</button>'
              : '<span style="color: var(--muted);">-</span>'}</td>
          </tr>
        \`).join("");
      };

      const buildOrdersUrl = () => {
        const url = new URL("/api/orders", window.location.origin);
        url.searchParams.set("limit", "50");

        const query = new URL(window.location.href).searchParams;
        const marketUuid = query.get("marketUuid") || marketFilter.value.trim();
        const status = query.get("status") || statusFilter.value.trim();

        if (marketUuid) {
          url.searchParams.set("marketUuid", marketUuid);
          marketFilter.value = marketUuid;
        }

        if (status) {
          url.searchParams.set("status", status);
          statusFilter.value = status;
        }

        return url.pathname + url.search;
      };

      const loadOrders = async () => {
        setStatus("Carregando ordens...");
        try {
          const payload = await window.ProjetoAlfaSession.fetchJsonWithAuth(buildOrdersUrl(), {
            method: "GET",
          });
          renderOrders(payload.items ?? []);
          setStatus("Ordens carregadas com sucesso.", "success");
        } catch (error) {
          ordersBody.innerHTML = '<tr><td colspan="9" class="empty-state">Nao foi possivel carregar as ordens.</td></tr>';
          setStatus(error.message, "danger");
        }
      };

      const bootstrapSession = async () => {
        try {
          const user = await window.ProjetoAlfaSession.resolveAdminUser();
          setIdentity({
            email: user.email,
            meta: "Role: " + user.role + " | Status: " + user.status,
          });
          return true;
        } catch (error) {
          const cachedUser = window.ProjetoAlfaSession.get()?.user;

          if (error?.code === "forbidden" && cachedUser) {
            showAccessDenied(cachedUser);
            return false;
          }

          if (error?.code === "unauthenticated") {
            redirectToLogin("expired");
            return false;
          }

          window.ProjetoAlfaSession.clear();
          redirectToLogin();
          return false;
        }
      };

      ordersBody.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-order-uuid]");
        if (!button) return;

        const orderUuid = button.dataset.orderUuid;
        if (!orderUuid) return;

        setStatus("Cancelando ordem...");

        try {
          await window.ProjetoAlfaSession.fetchJsonWithAuth("/api/orders/" + orderUuid + "/cancel", {
            method: "POST",
          });
          setStatus("Ordem cancelada com sucesso.", "success");
          await loadOrders();
        } catch (error) {
          setStatus(error.message, "danger");
        }
      });

      document.getElementById("apply-filters").addEventListener("click", loadOrders);
      document.getElementById("logout-button").addEventListener("click", logout);
      document.getElementById("denied-logout").addEventListener("click", logout);
      document.getElementById("denied-switch-account").addEventListener("click", switchAccount);

      bootstrapSession().then((isAuthenticated) => {
        if (isAuthenticated) {
          loadOrders();
        }
      });
    </script>
  </body>
</html>`;
};
