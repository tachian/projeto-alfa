import { escapeHtml } from "./html.js";

import { renderSessionClientScript } from "./session.js";

export const renderAdminDashboardPage = (input: {
  appName: string;
}) => {
  const safeAppName = escapeHtml(input.appName);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeAppName}</title>
    <style>
      :root {
        --bg: #f4efe6;
        --panel: rgba(255, 251, 245, 0.9);
        --panel-strong: #fffaf3;
        --ink: #1b1510;
        --muted: #6d5f4f;
        --line: rgba(50, 34, 19, 0.14);
        --accent: #b14d2d;
        --accent-soft: #efc7ae;
        --success: #276749;
        --warning: #8a5b17;
        --danger: #9b2c2c;
        --shadow: 0 24px 80px rgba(68, 42, 18, 0.14);
      }

      * {
        box-sizing: border-box;
      }

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
        padding: 32px 0 64px;
      }

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

      .panel {
        padding: 24px;
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
        font-size: clamp(2.6rem, 5vw, 4.4rem);
        line-height: 0.92;
        max-width: 10ch;
      }

      p {
        color: var(--muted);
        line-height: 1.7;
      }

      .layout {
        display: grid;
        grid-template-columns: 420px minmax(0, 1fr);
        gap: 18px;
        margin-top: 22px;
      }

      label {
        display: grid;
        gap: 8px;
        font-size: 0.92rem;
        color: var(--muted);
      }

      input, select, textarea, button {
        font: inherit;
      }

      input, select, textarea {
        width: 100%;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(76, 51, 24, 0.12);
        background: rgba(255, 255, 255, 0.78);
        color: var(--ink);
      }

      textarea {
        min-height: 136px;
        resize: vertical;
      }

      .field-grid {
        display: grid;
        gap: 14px;
      }

      .field-grid.two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
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

      button.warning {
        background: #b7791f;
      }

      button.ghost {
        background: transparent;
        border: 1px solid rgba(76, 51, 24, 0.14);
        color: var(--ink);
      }

      button:disabled {
        opacity: 0.65;
        cursor: progress;
      }

      .status {
        margin-top: 14px;
        padding: 14px 16px;
        border-radius: 16px;
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
        margin-top: 22px;
        padding: 22px;
        border-radius: 22px;
        border: 1px solid rgba(155, 44, 44, 0.14);
        background: rgba(155, 44, 44, 0.08);
        color: var(--danger);
      }

      .access-denied h2 {
        font-size: 1.8rem;
      }

      .access-denied p {
        color: inherit;
      }

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

      .market-list {
        display: grid;
        gap: 14px;
        margin-top: 18px;
      }

      .market-card {
        padding: 18px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.65);
      }

      .market-card header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
      }

      .market-card h3 {
        margin: 0;
        font-size: 1.2rem;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(177, 77, 45, 0.1);
        color: var(--accent);
        font-size: 0.82rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .pill[data-status="open"] {
        color: var(--success);
        background: rgba(39, 103, 73, 0.12);
      }

      .pill[data-status="draft"], .pill[data-status="suspended"] {
        color: var(--warning);
        background: rgba(138, 91, 23, 0.12);
      }

      .muted {
        color: var(--muted);
      }

      .market-meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 14px;
        color: var(--muted);
        font-size: 0.93rem;
      }

      .market-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }

      a {
        color: var(--accent);
        text-decoration: none;
      }

      @media (max-width: 980px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .hero-top {
          flex-direction: column;
        }
      }

      @media (max-width: 720px) {
        .field-grid.two,
        .market-meta {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">${safeAppName}</div>
            <h1>Operacao de mercados em um so painel</h1>
            <p>Crie mercados, ajuste regras, suspenda contratos e feche listagens com o mesmo fluxo usado pela API administrativa.</p>
          </div>
          <aside class="identity-card">
            <div class="identity-label">Sessao</div>
            <div id="identity-email" class="identity-value">Nao autenticado</div>
            <div id="identity-meta" class="identity-meta">O dashboard valida a sessao ao carregar.</div>
          </aside>
        </div>
      </section>

      <section id="access-denied" class="access-denied" hidden>
        <div class="eyebrow">Acesso</div>
        <h2>Acesso restrito</h2>
        <p>Esta conta esta autenticada, mas nao possui a role administrativa necessaria para operar o painel.</p>
      </section>

      <section id="dashboard-layout" class="layout">
        <article class="panel">
          <div class="eyebrow">Sessao</div>
          <h2>Token e criacao</h2>
          <p>O dashboard valida a sessao automaticamente e reutiliza o token salvo para operar as rotas administrativas.</p>

          <div class="field-grid">
            <label>
              Bearer token
              <textarea id="auth-token" placeholder="Cole aqui o access token do admin"></textarea>
            </label>
            <div class="toolbar">
              <button id="save-token" type="button" class="secondary">Salvar token</button>
              <button id="refresh-markets" type="button" class="ghost">Atualizar lista</button>
            </div>
          </div>

          <hr style="margin: 24px 0; border: 0; border-top: 1px solid rgba(76, 51, 24, 0.1);" />

          <div class="eyebrow">Novo mercado</div>
          <h2 style="margin-top: 8px;">Criar mercado</h2>
          <form id="create-market-form" class="field-grid" style="margin-top: 18px;">
            <label>Slug<input name="slug" required minlength="3" maxlength="120" placeholder="fed-rate-cut-junho" /></label>
            <label>Titulo<input name="title" required minlength="3" maxlength="255" placeholder="Fed corta juros em junho?" /></label>
            <div class="field-grid two">
              <label>Categoria<input name="category" required minlength="2" maxlength="120" placeholder="macro" /></label>
              <label>Status
                <select name="status">
                  <option value="draft">draft</option>
                  <option value="open">open</option>
                  <option value="suspended">suspended</option>
                  <option value="closed">closed</option>
                  <option value="resolving">resolving</option>
                  <option value="resolved">resolved</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </label>
            </div>
            <div class="field-grid two">
              <label>Tipo
                <select name="outcomeType">
                  <option value="binary">binary</option>
                </select>
              </label>
              <label>Tick size<input name="tickSize" type="number" min="1" step="1" value="1" /></label>
            </div>
            <div class="field-grid two">
              <label>Valor do contrato<input name="contractValue" type="number" min="0.01" step="0.01" value="1.00" /></label>
              <label>Abre em<input name="openAt" type="datetime-local" /></label>
            </div>
            <label>Fecha em<input name="closeAt" type="datetime-local" required /></label>
            <label>Fonte oficial<input name="officialSourceLabel" required minlength="3" maxlength="255" placeholder="Federal Reserve" /></label>
            <label>URL da fonte oficial<input name="officialSourceUrl" type="url" required maxlength="2048" placeholder="https://www.federalreserve.gov/" /></label>
            <label>Regras de resolucao<textarea name="resolutionRules" required minlength="3" maxlength="5000" placeholder="O mercado resolve como YES se..."></textarea></label>
            <button id="create-market-button" type="submit">Criar mercado</button>
          </form>
        </article>

        <article class="panel">
          <div class="eyebrow">Mercados</div>
          <h2>Lista administrativa</h2>
          <p>Use a listagem para abrir a ficha completa, suspender rapidamente ou encerrar o mercado quando chegar a hora.</p>
          <div id="dashboard-status" class="status">Validando sessao do admin...</div>
          <div id="market-list" class="market-list"></div>
        </article>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}

      const statusNode = document.getElementById("dashboard-status");
      const listNode = document.getElementById("market-list");
      const tokenNode = document.getElementById("auth-token");
      const createForm = document.getElementById("create-market-form");

      const setStatus = (message, tone = "default") => {
        statusNode.textContent = message;
        statusNode.dataset.tone = tone;
      };

      const setIdentity = (input) => {
        document.getElementById("identity-email").textContent = input.email;
        document.getElementById("identity-meta").textContent = input.meta;
      };

      const showAccessDenied = (user) => {
        document.getElementById("dashboard-layout").hidden = true;
        document.getElementById("access-denied").hidden = false;
        setIdentity({
          email: user.email,
          meta: "Role: " + user.role + " | Status: " + user.status,
        });
        setStatus("Acesso restrito a administradores.", "danger");
      };

      const redirectToLogin = (reason = "") => {
        const targetUrl = window.ProjetoAlfaSession.buildLoginRedirectUrl(reason);
        window.location.href = targetUrl;
      };

      const getToken = () => tokenNode.value.trim();
      const saveToken = () => {
        window.ProjetoAlfaSession.setAccessToken(getToken());
        setStatus("Token salvo no navegador.", "success");
      };

      const authHeaders = () => {
        const token = window.ProjetoAlfaSession.getAccessToken();
        return token ? { Authorization: "Bearer " + token } : {};
      };

      const formatDate = (value) => {
        if (!value) return "Nao definido";
        return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
      };

      const toDatetimeLocal = (value) => {
        if (!value) return "";
        const date = new Date(value);
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
      };

      const renderMarkets = (items) => {
        if (!items.length) {
          listNode.innerHTML = "<div class=\\"market-card\\"><strong>Nenhum mercado encontrado.</strong><p class=\\"muted\\">Crie o primeiro mercado no formulario ao lado.</p></div>";
          return;
        }

        listNode.innerHTML = items.map((market) => \`
          <article class="market-card">
            <header>
              <div>
                <h3>\${market.title}</h3>
                <div class="muted">\${market.slug}</div>
              </div>
              <span class="pill" data-status="\${market.status}">\${market.status}</span>
            </header>
            <div class="market-meta">
              <div><strong>Categoria:</strong><br />\${market.category}</div>
              <div><strong>Fecha:</strong><br />\${formatDate(market.closeAt)}</div>
              <div><strong>Contrato:</strong><br />$ \${market.contractValue}</div>
            </div>
            <div class="market-actions">
              <a href="/markets/\${market.uuid}">Abrir ficha</a>
              <button type="button" data-action="suspend" data-market-uuid="\${market.uuid}">Suspender</button>
              <button type="button" class="warning" data-action="close" data-market-uuid="\${market.uuid}">Fechar</button>
            </div>
          </article>
        \`).join("");
      };

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

      const bootstrapSession = async () => {
        const accessToken = window.ProjetoAlfaSession.getAccessToken();

        if (!accessToken) {
          redirectToLogin();
          return false;
        }

        try {
          const payload = await fetchJson("/api/auth/me", {
            method: "GET",
          });

          try {
            window.ProjetoAlfaSession.requireAdminSession(payload.user);
          } catch (error) {
            if (error?.code === "forbidden") {
              window.ProjetoAlfaSession.updateUser(payload.user);
              tokenNode.value = accessToken;
              showAccessDenied(payload.user);
              return false;
            }

            throw error;
          }

          window.ProjetoAlfaSession.updateUser(payload.user);
          tokenNode.value = accessToken;
          setIdentity({
            email: payload.user.email,
            meta: "Role: " + payload.user.role + " | Status: " + payload.user.status,
          });
          setStatus("Sessao validada. Carregando mercados...", "success");
          return true;
        } catch (error) {
          window.ProjetoAlfaSession.clear();
          const reason = error?.code === "unauthenticated" ? "expired" : "";
          redirectToLogin(reason);
          return false;
        }
      };

      const loadMarkets = async () => {
        setStatus("Carregando mercados administrativos...");
        try {
          const payload = await fetchJson("/api/admin/markets", { method: "GET" });
          renderMarkets(payload.items);
          setStatus("Mercados carregados com sucesso.", "success");
        } catch (error) {
          listNode.innerHTML = "";
          setStatus(error.message, "danger");
        }
      };

      const buildCreatePayload = (form) => {
        const formData = new FormData(form);
        return {
          slug: String(formData.get("slug") ?? "").trim(),
          title: String(formData.get("title") ?? "").trim(),
          category: String(formData.get("category") ?? "").trim(),
          status: String(formData.get("status") ?? "draft").trim(),
          outcomeType: String(formData.get("outcomeType") ?? "binary").trim(),
          contractValue: String(formData.get("contractValue") ?? "1").trim(),
          tickSize: Number(formData.get("tickSize") ?? 1),
          openAt: formData.get("openAt") ? new Date(String(formData.get("openAt"))).toISOString() : null,
          closeAt: new Date(String(formData.get("closeAt"))).toISOString(),
          officialSourceLabel: String(formData.get("officialSourceLabel") ?? "").trim(),
          officialSourceUrl: String(formData.get("officialSourceUrl") ?? "").trim(),
          resolutionRules: String(formData.get("resolutionRules") ?? "").trim(),
        };
      };

      const updateMarketStatus = async (marketUuid, status) => {
        setStatus("Atualizando mercado " + marketUuid + " para " + status + "...");
        try {
          await fetchJson("/api/admin/markets/" + marketUuid, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          });
          await loadMarkets();
        } catch (error) {
          setStatus(error.message, "danger");
        }
      };

      tokenNode.value = window.ProjetoAlfaSession.getAccessToken();
      document.getElementById("save-token").addEventListener("click", saveToken);
      document.getElementById("refresh-markets").addEventListener("click", loadMarkets);

      createForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setStatus("Criando mercado...");
        try {
          const payload = await fetchJson("/api/admin/markets", {
            method: "POST",
            body: JSON.stringify(buildCreatePayload(createForm)),
          });
          createForm.reset();
          createForm.elements.status.value = "draft";
          createForm.elements.outcomeType.value = "binary";
          createForm.elements.tickSize.value = "1";
          createForm.elements.contractValue.value = "1.00";
          setStatus("Mercado criado com sucesso. UUID: " + payload.market.uuid, "success");
          await loadMarkets();
        } catch (error) {
          setStatus(error.message, "danger");
        }
      });

      listNode.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const marketUuid = button.dataset.marketUuid;
        const action = button.dataset.action;
        if (!marketUuid || !action) return;

        const nextStatus = action === "suspend" ? "suspended" : "closed";
        updateMarketStatus(marketUuid, nextStatus);
      });

      bootstrapSession().then((isAuthenticated) => {
        if (isAuthenticated) {
          loadMarkets();
        }
      });
    </script>
  </body>
</html>`;
};
