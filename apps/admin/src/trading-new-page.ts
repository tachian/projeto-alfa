import { renderAdminChromeStyles, renderAdminNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderTradingNewPage = (input: {
  appName: string;
  pathname: string;
}) => {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nova ordem | ${input.appName}</title>
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

      h1, h2, h3 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        font-weight: 700;
        letter-spacing: -0.03em;
      }

      h1 {
        margin-top: 12px;
        font-size: clamp(2.3rem, 5vw, 4rem);
        line-height: 0.95;
        max-width: 10ch;
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
        color: var(--ink);
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

      .access-denied, .status {
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

      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
        gap: 18px;
        margin-top: 22px;
      }

      .panel { padding: 24px; }

      .form-grid {
        display: grid;
        gap: 14px;
        margin-top: 18px;
      }

      .form-grid.two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      label {
        display: grid;
        gap: 8px;
        font-size: 0.92rem;
        color: var(--muted);
      }

      input, select, button {
        font: inherit;
      }

      input, select {
        width: 100%;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(76, 51, 24, 0.12);
        background: rgba(255, 255, 255, 0.78);
        color: var(--ink);
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

      .market-list {
        display: grid;
        gap: 12px;
        margin-top: 18px;
      }

      .market-card {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.62);
      }

      .market-card h3 {
        margin: 0;
        font-size: 1.05rem;
      }

      .market-card p {
        margin: 8px 0 0;
      }

      .market-card button {
        margin-top: 14px;
      }

      .empty-state {
        padding: 16px;
        color: var(--muted);
        border-radius: 18px;
        border: 1px dashed var(--line);
      }

      .action-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      @media (max-width: 980px) {
        .hero-top, .layout, .form-grid.two {
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
            <h1>Nova ordem operacional</h1>
            <p>Use esta tela para enviar ordens sem poluir a ficha do mercado. O formulario aceita apenas ordens limit do MVP.</p>
          </div>
          <aside class="identity-card">
            <div class="identity-label">Sessao</div>
            <div id="identity-email" class="identity-value">Nao autenticado</div>
            <div id="identity-meta" class="identity-meta">A area de trading valida a sessao ao carregar.</div>
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

      <section id="workspace-content" class="layout">
        <article class="panel">
          <div class="eyebrow">Ordem</div>
          <h2>Enviar ordem</h2>
          <p>Preencha mercado, lado, resultado, preco e quantidade. Se houver liquidez compatível, o matching pode executar um trade imediatamente.</p>
          <form id="order-form" class="form-grid">
            <label>
              Market UUID
              <input id="market-uuid" name="marketUuid" placeholder="UUID do mercado" required />
            </label>
            <div class="form-grid two">
              <label>
                Lado
                <select id="side" name="side">
                  <option value="buy">buy</option>
                  <option value="sell">sell</option>
                </select>
              </label>
              <label>
                Outcome
                <select id="outcome" name="outcome">
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </label>
            </div>
            <div class="form-grid two">
              <label>
                Preco
                <input id="price" name="price" type="number" min="1" max="99" step="1" value="50" required />
              </label>
              <label>
                Quantidade
                <input id="quantity" name="quantity" type="number" min="1" step="1" value="1" required />
              </label>
            </div>
            <div class="action-row">
              <button id="submit-order" type="submit">Enviar ordem</button>
              <a href="/trading/orders" style="align-self:center; color: var(--accent); text-decoration:none; font-weight:700;">Ver ordens</a>
            </div>
          </form>
          <div id="order-status" class="status">Validando sessao do admin...</div>
        </article>

        <aside class="panel">
          <div class="eyebrow">Mercados abertos</div>
          <h2>Atalho rapido</h2>
          <p>Escolha um mercado aberto para preencher o formulario mais rapidamente.</p>
          <div id="open-markets" class="market-list">
            <div class="empty-state">Carregando mercados abertos...</div>
          </div>
        </aside>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}

      const statusNode = document.getElementById("order-status");
      const marketsNode = document.getElementById("open-markets");
      const form = document.getElementById("order-form");
      const marketUuidInput = document.getElementById("market-uuid");

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

      const fetchJson = async (url, options = {}) => {
        const response = await window.ProjetoAlfaSession.fetchWithAuth(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
          },
        });

        const payloadText = await response.text();
        const payload = payloadText ? JSON.parse(payloadText) : null;

        if (!response.ok) {
          throw new Error(payload?.message ?? "Nao foi possivel concluir a operacao.");
        }

        return payload;
      };

      const showAccessDenied = (user) => {
        document.getElementById("workspace-content").hidden = true;
        document.getElementById("access-denied").hidden = false;
        setIdentity({
          email: user.email,
          meta: "Role: " + user.role + " | Status: " + user.status,
        });
        setStatus("Acesso restrito a administradores.", "danger");
      };

      const renderOpenMarkets = (items) => {
        if (!items.length) {
          marketsNode.innerHTML = '<div class="empty-state">Nenhum mercado aberto encontrado.</div>';
          return;
        }

        marketsNode.innerHTML = items.map((market) => \`
          <article class="market-card">
            <h3>\${market.title}</h3>
            <p>\${market.category} · fecha em \${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(market.closeAt))}</p>
            <button type="button" data-market-uuid="\${market.uuid}">Usar este mercado</button>
          </article>
        \`).join("");
      };

      const loadOpenMarkets = async () => {
        try {
          const response = await fetch("/api/markets?status=open");
          const payload = await response.json();
          renderOpenMarkets(payload.items ?? []);
        } catch {
          marketsNode.innerHTML = '<div class="empty-state">Nao foi possivel carregar mercados abertos.</div>';
        }
      };

      const bootstrapSession = async () => {
        const accessToken = window.ProjetoAlfaSession.getAccessToken();

        if (!accessToken) {
          redirectToLogin();
          return false;
        }

        try {
          const payload = await fetchJson("/api/auth/me", { method: "GET" });

          try {
            window.ProjetoAlfaSession.requireAdminSession(payload.user);
          } catch (error) {
            if (error?.code === "forbidden") {
              window.ProjetoAlfaSession.updateUser(payload.user);
              showAccessDenied(payload.user);
              return false;
            }
            throw error;
          }

          window.ProjetoAlfaSession.updateUser(payload.user);
          setIdentity({
            email: payload.user.email,
            meta: "Role: " + payload.user.role + " | Status: " + payload.user.status,
          });
          setStatus("Sessao validada. Preencha a ordem.", "success");

          const query = new URL(window.location.href).searchParams.get("marketUuid");
          if (query) {
            marketUuidInput.value = query;
          }

          return true;
        } catch (error) {
          window.ProjetoAlfaSession.clear();
          redirectToLogin(error?.code === "unauthenticated" ? "expired" : "");
          return false;
        }
      };

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        setStatus("Enviando ordem...");

        const formData = new FormData(form);
        const payload = {
          marketUuid: String(formData.get("marketUuid") ?? "").trim(),
          side: String(formData.get("side") ?? "buy"),
          outcome: String(formData.get("outcome") ?? "YES"),
          price: Number(formData.get("price") ?? 0),
          quantity: Number(formData.get("quantity") ?? 0),
        };

        try {
          const result = await fetchJson("/api/orders", {
            method: "POST",
            body: JSON.stringify(payload),
          });

          setStatus("Ordem enviada com sucesso. UUID: " + result.order.uuid, "success");
          window.location.href = "/trading/orders?marketUuid=" + encodeURIComponent(result.order.marketUuid);
        } catch (error) {
          setStatus(error.message, "danger");
        }
      });

      marketsNode.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-market-uuid]");
        if (!button) return;
        marketUuidInput.value = button.dataset.marketUuid;
        setStatus("Mercado selecionado. Ajuste lado, outcome, preco e quantidade.", "success");
      });

      document.getElementById("logout-button").addEventListener("click", logout);
      document.getElementById("denied-logout").addEventListener("click", logout);
      document.getElementById("denied-switch-account").addEventListener("click", switchAccount);

      bootstrapSession().then((isAuthenticated) => {
        if (isAuthenticated) {
          loadOpenMarkets();
        }
      });
    </script>
  </body>
</html>`;
};
