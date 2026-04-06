import { escapeHtml } from "./html.js";
import { renderSessionClientScript } from "./session.js";

export const renderMarketPage = (input: {
  appName: string;
  marketUuid: string;
}) => {
  const title = `Mercado ${input.marketUuid} | ${input.appName}`;
  const safeMarketUuid = escapeHtml(input.marketUuid);
  const safeAppName = escapeHtml(input.appName);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
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
        --danger: #8c2f1c;
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
        width: min(1280px, calc(100% - 32px));
        margin: 0 auto;
        padding: 40px 0 64px;
      }

      .hero,
      .panel {
        border-radius: 26px;
        border: 1px solid rgba(98, 60, 28, 0.12);
        background:
          linear-gradient(135deg, rgba(255, 251, 245, 0.96), rgba(248, 232, 214, 0.88)),
          var(--panel);
        box-shadow: var(--shadow);
      }

      .hero {
        position: relative;
        overflow: hidden;
        padding: 32px;
      }

      .hero::after {
        content: "";
        position: absolute;
        inset: auto -80px -120px auto;
        width: 280px;
        height: 280px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(177, 77, 45, 0.22), transparent 68%);
        pointer-events: none;
      }

      .hero-top {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: flex-start;
      }

      h1, h2, h3 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        letter-spacing: -0.03em;
      }

      h1 {
        margin-top: 12px;
        font-size: clamp(2.4rem, 5vw, 4.5rem);
        line-height: 0.92;
        max-width: 12ch;
      }

      h2 {
        font-size: 1.65rem;
      }

      .eyebrow {
        font-size: 0.8rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .subtitle {
        margin-top: 18px;
        max-width: 60ch;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.7;
      }

      .market-id {
        margin-top: 20px;
        font-size: 0.9rem;
        color: var(--muted);
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

      .identity-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 14px;
      }

      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
        gap: 18px;
        margin-top: 22px;
        align-items: start;
      }

      .left-column,
      .right-column {
        display: grid;
        gap: 18px;
      }

      .panel-body {
        padding: 24px;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }

      .trading-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      .stat {
        padding: 16px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.62);
        border: 1px solid rgba(76, 51, 24, 0.08);
      }

      .stat-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
      }

      .stat-value {
        margin-top: 8px;
        font-size: 1.1rem;
        line-height: 1.4;
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
      }

      .pill[data-status="open"],
      .pill[data-status="connected"] {
        color: var(--success);
        background: rgba(39, 103, 73, 0.12);
      }

      .pill[data-status="draft"],
      .pill[data-status="suspended"],
      .pill[data-status="connecting"] {
        color: var(--warning);
        background: rgba(138, 91, 23, 0.12);
      }

      .pill[data-status="closed"],
      .pill[data-status="resolved"],
      .pill[data-status="cancelled"],
      .pill[data-status="offline"] {
        color: var(--danger);
        background: rgba(140, 47, 28, 0.12);
      }

      .section-copy {
        margin-top: 14px;
        color: var(--muted);
        line-height: 1.7;
      }

      .source-link {
        color: var(--accent);
        text-decoration: none;
        border-bottom: 1px solid rgba(177, 77, 45, 0.25);
      }

      .source-link:hover {
        border-bottom-color: rgba(177, 77, 45, 0.7);
      }

      .table-wrap {
        margin-top: 16px;
        overflow: auto;
        border-radius: 18px;
        border: 1px solid rgba(76, 51, 24, 0.08);
        background: rgba(255, 255, 255, 0.62);
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
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
        position: sticky;
        top: 0;
        background: rgba(255, 248, 241, 0.98);
      }

      tbody tr:last-child td {
        border-bottom: 0;
      }

      .row-buy td:first-child,
      .row-buy td:nth-child(2) {
        color: var(--success);
      }

      .row-sell td:first-child,
      .row-sell td:nth-child(2) {
        color: var(--danger);
      }

      .empty-state {
        padding: 18px;
        color: var(--muted);
      }

      .status-stack {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        margin-top: 18px;
      }

      .admin-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      textarea,
      input,
      button {
        font: inherit;
      }

      textarea,
      input {
        width: 100%;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(76, 51, 24, 0.12);
        background: rgba(255, 255, 255, 0.78);
        color: var(--ink);
      }

      textarea {
        min-height: 110px;
        resize: vertical;
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

      button.warning {
        background: #b7791f;
      }

      button.secondary {
        background: rgba(27, 21, 16, 0.08);
        color: var(--ink);
      }

      .form-grid {
        display: grid;
        gap: 14px;
        margin-top: 18px;
      }

      .form-grid.two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .field-label {
        display: grid;
        gap: 8px;
        font-size: 0.92rem;
        color: var(--muted);
      }

      .admin-status {
        margin-top: 18px;
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(177, 77, 45, 0.1);
        color: var(--accent);
      }

      .admin-status[data-tone="success"] {
        background: rgba(39, 103, 73, 0.12);
        color: var(--success);
      }

      .admin-status[data-tone="danger"] {
        background: rgba(154, 44, 26, 0.12);
        color: var(--danger);
      }

      .loading,
      .error-card {
        margin-top: 22px;
        padding: 18px 20px;
        border-radius: 18px;
      }

      .loading {
        display: grid;
        place-items: center;
        color: var(--muted);
        min-height: 200px;
        border: 1px solid rgba(76, 51, 24, 0.08);
        background: rgba(255, 255, 255, 0.62);
      }

      .error-card {
        border: 1px solid rgba(154, 44, 26, 0.14);
        background: rgba(255, 241, 236, 0.8);
        color: var(--danger);
      }

      .access-denied {
        margin-top: 22px;
        padding: 18px 20px;
        border-radius: 18px;
        border: 1px solid rgba(154, 44, 26, 0.14);
        background: rgba(255, 241, 236, 0.8);
        color: var(--danger);
      }

      @media (max-width: 1060px) {
        .hero-top,
        .layout,
        .trading-grid,
        .form-grid.two,
        .meta-grid {
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
            <h1 id="market-title">Carregando mercado</h1>
            <p class="subtitle" id="market-subtitle">
              Estamos preparando a leitura completa do contrato, do book e das ultimas execucoes.
            </p>
            <div class="market-id">UUID do mercado: <strong>${safeMarketUuid}</strong></div>
          </div>
          <aside class="identity-card">
            <div class="identity-label">Sessao</div>
            <div id="identity-email" class="identity-value">Nao autenticado</div>
            <div id="identity-meta" class="identity-meta">A ficha valida a sessao ao carregar.</div>
            <div class="identity-actions">
              <button id="logout-button" type="button" class="secondary">Sair</button>
            </div>
          </aside>
        </div>
      </section>

      <div id="market-state" class="loading">Buscando mercado, book e execucoes recentes...</div>

      <section id="market-layout" class="layout" hidden>
        <div class="left-column">
          <article class="panel">
            <div class="panel-body">
              <div class="status-stack">
                <span class="pill" id="market-status-pill">status</span>
                <span class="pill" id="socket-status-pill" data-status="connecting">tempo real</span>
              </div>
              <div class="meta-grid">
                <div class="stat">
                  <div class="stat-label">Categoria</div>
                  <div class="stat-value" id="market-category">-</div>
                </div>
                <div class="stat">
                  <div class="stat-label">Tipo</div>
                  <div class="stat-value" id="market-outcome-type">-</div>
                </div>
                <div class="stat">
                  <div class="stat-label">Abre</div>
                  <div class="stat-value" id="market-open-at">-</div>
                </div>
                <div class="stat">
                  <div class="stat-label">Fecha</div>
                  <div class="stat-value" id="market-close-at">-</div>
                </div>
              </div>
            </div>
          </article>

          <section class="trading-grid">
            <article class="panel">
              <div class="panel-body">
                <div class="eyebrow">Order Book</div>
                <h2>Liquidez por nivel</h2>
                <p class="section-copy">O book combina as ordens abertas e parcialmente executadas do mercado.</p>
                <div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Lado</th>
                        <th>Resultado</th>
                        <th>Preco</th>
                        <th>Quantidade</th>
                        <th>Ordens</th>
                      </tr>
                    </thead>
                    <tbody id="order-book-body">
                      <tr><td colspan="5" class="empty-state">Sem niveis de book neste momento.</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </article>

            <article class="panel">
              <div class="panel-body">
                <div class="eyebrow">Tape</div>
                <h2>Ultimas execucoes</h2>
                <p class="section-copy">Cada negocio entra aqui assim que o matching engine confirma a execucao.</p>
                <div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Horario</th>
                        <th>Preco</th>
                        <th>Quantidade</th>
                        <th>Trade</th>
                      </tr>
                    </thead>
                    <tbody id="recent-trades-body">
                      <tr><td colspan="4" class="empty-state">Nenhuma execucao recente.</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          </section>

          <article class="panel">
            <div class="panel-body">
              <div class="eyebrow">Minha atividade</div>
              <h2>Ordens do usuario</h2>
              <p class="section-copy">As ordens desta area usam automaticamente a sessao autenticada do admin.</p>
              <div class="admin-toolbar">
                <button type="button" id="refresh-orders" class="secondary">Atualizar ordens</button>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Lado</th>
                      <th>Resultado</th>
                      <th>Status</th>
                      <th>Preco</th>
                      <th>Qtd</th>
                      <th>Restante</th>
                      <th>Criada em</th>
                    </tr>
                  </thead>
                  <tbody id="user-orders-body">
                    <tr><td colspan="7" class="empty-state">As ordens aparecem aqui depois do login.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </article>

          <article class="panel">
            <div class="panel-body">
              <div class="eyebrow">Regras</div>
              <h2>Como este mercado resolve</h2>
              <p class="section-copy" id="market-rules">-</p>
            </div>
          </article>

          <article class="panel">
            <div class="panel-body">
              <div class="eyebrow">Resolucao Assistida</div>
              <h2>Historico de resolucao</h2>
              <p class="section-copy">Acompanhe a trilha de resolucoes manuais e as tentativas de liquidacao deste mercado.</p>
              <div class="admin-toolbar">
                <button type="button" id="refresh-resolution-data" class="secondary">Atualizar historico</button>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Resultado</th>
                      <th>Fonte</th>
                      <th>Resolvido em</th>
                    </tr>
                  </thead>
                  <tbody id="resolution-history-body">
                    <tr><td colspan="4" class="empty-state">Nenhuma resolucao registrada ainda.</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Contratos</th>
                      <th>Payout</th>
                      <th>Iniciada em</th>
                      <th>Run</th>
                    </tr>
                  </thead>
                  <tbody id="settlement-run-history-body">
                    <tr><td colspan="5" class="empty-state">Nenhum settlement run registrado ainda.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </div>

        <div class="right-column">
          <article class="panel">
            <div class="panel-body">
              <div class="eyebrow">Contrato</div>
              <h2 id="market-contract-value">$ 0,00</h2>
              <p class="section-copy" id="market-contract-copy">
                Cada contrato liquida conforme as regras oficiais abaixo.
              </p>
            </div>
          </article>

          <article class="panel">
            <div class="panel-body">
              <div class="eyebrow">Fonte Oficial</div>
              <h2 id="market-source-label">-</h2>
              <p class="section-copy">
                A resolucao depende exclusivamente da fonte oficial configurada para este mercado.
              </p>
              <a id="market-source-url" class="source-link" href="#" target="_blank" rel="noreferrer">
                Abrir fonte oficial
              </a>
            </div>
          </article>

          <article class="panel">
            <div class="panel-body">
              <div class="eyebrow">Operacao</div>
              <h2>Editar mercado</h2>
              <p class="section-copy">A ficha publica continua visivel, mas aqui voce tambem pode ajustar o cadastro administrativo e trocar o estado do mercado usando a sessao autenticada do painel.</p>
              <div class="admin-toolbar">
                <button type="button" id="suspend-market">Suspender</button>
                <button type="button" id="close-market" class="warning">Fechar</button>
              </div>
              <form id="market-form" class="form-grid">
                <label class="field-label">Titulo<input name="title" required /></label>
                <div class="form-grid two">
                  <label class="field-label">Slug<input name="slug" required /></label>
                  <label class="field-label">Categoria<input name="category" required /></label>
                </div>
                <div class="form-grid two">
                  <label class="field-label">Status<input name="status" required /></label>
                  <label class="field-label">Tipo<input name="outcomeType" required /></label>
                </div>
                <div class="form-grid two">
                  <label class="field-label">Tick size<input name="tickSize" type="number" min="1" step="1" required /></label>
                  <label class="field-label">Valor do contrato<input name="contractValue" type="number" min="0.01" step="0.01" required /></label>
                </div>
                <div class="form-grid two">
                  <label class="field-label">Abre em<input name="openAt" type="datetime-local" /></label>
                  <label class="field-label">Fecha em<input name="closeAt" type="datetime-local" required /></label>
                </div>
                <label class="field-label">Fonte oficial<input name="officialSourceLabel" required /></label>
                <label class="field-label">URL da fonte oficial<input name="officialSourceUrl" type="url" required /></label>
                <label class="field-label">Regras de resolucao<textarea name="resolutionRules" required></textarea></label>
                <button type="submit" id="save-market">Salvar alteracoes</button>
              </form>
              <div id="admin-status" class="admin-status">Validando sessao do admin para liberar as acoes desta pagina.</div>
            </div>
          </article>

          <article class="panel">
            <div class="panel-body">
              <div class="eyebrow">Resolucao Manual</div>
              <h2>Guiar resolucao e liquidacao</h2>
              <p class="section-copy">Use esta area para registrar a decisao oficial do mercado e acompanhar a execucao assistida da liquidacao.</p>
              <form id="resolution-form" class="form-grid">
                <div class="form-grid two">
                  <label class="field-label">Status da resolucao
                    <input name="status" value="pending" required />
                  </label>
                  <label class="field-label">Resultado vencedor
                    <input name="winningOutcome" placeholder="YES ou NO" />
                  </label>
                </div>
                <label class="field-label">Valor da fonte oficial
                  <input name="sourceValue" placeholder="Texto curto com o valor publicado" />
                </label>
                <label class="field-label">Notas operacionais
                  <textarea name="notes" placeholder="Observacoes internas sobre a resolucao"></textarea>
                </label>
                <button type="submit" id="save-resolution">Registrar resolucao</button>
              </form>
              <form id="settlement-run-form" class="form-grid">
                <label class="field-label">UUID da resolucao
                  <input name="marketResolutionUuid" placeholder="Preenchido automaticamente ao escolher a ultima resolucao" />
                </label>
                <div class="form-grid two">
                  <label class="field-label">Status do settlement run
                    <input name="status" value="pending" required />
                  </label>
                  <label class="field-label">Contratos processados
                    <input name="contractsProcessed" type="number" min="0" step="1" value="0" />
                  </label>
                </div>
                <label class="field-label">Payout total
                  <input name="totalPayout" type="number" min="0" step="0.0001" value="0" />
                </label>
                <label class="field-label">Metadata em JSON
                  <textarea name="metadata" placeholder='{"dryRun": true}'></textarea>
                </label>
                <div class="admin-toolbar">
                  <button type="button" id="create-settlement-run">Criar settlement run</button>
                  <button type="button" id="update-latest-settlement-run" class="secondary">Atualizar ultimo run</button>
                  <button type="button" id="execute-latest-settlement-run" class="warning">Executar ultimo run</button>
                </div>
              </form>
            </div>
          </article>
        </div>
      </section>

      <section id="market-access-denied" class="access-denied" hidden>
        <div class="eyebrow">Acesso</div>
        <h2>Acesso restrito</h2>
        <p>Esta conta esta autenticada, mas nao possui a role administrativa necessaria para operar esta ficha de mercado.</p>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}

      const marketUuid = ${JSON.stringify(input.marketUuid)};
      let recentTrades = [];
      let recentResolutions = [];
      let recentSettlementRuns = [];
      let liveSocket = null;

      const formatDate = (value) => {
        if (!value) return "Nao definido";
        return new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "medium",
          timeStyle: "short"
        }).format(new Date(value));
      };

      const toDatetimeLocal = (value) => {
        if (!value) return "";
        const date = new Date(value);
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
      };

      const setError = (message) => {
        const state = document.getElementById("market-state");
        state.className = "error-card";
        state.textContent = message;
      };

      const setAdminStatus = (message, tone = "default") => {
        const node = document.getElementById("admin-status");
        node.textContent = message;
        node.dataset.tone = tone;
      };

      const setSocketStatus = (status, label) => {
        const node = document.getElementById("socket-status-pill");
        node.dataset.status = status;
        node.textContent = label;
      };

      const redirectToLogin = (reason = "") => {
        const targetUrl = window.ProjetoAlfaSession.buildLoginRedirectUrl(reason);
        window.location.href = targetUrl;
      };

      const setIdentity = (input) => {
        document.getElementById("identity-email").textContent = input.email;
        document.getElementById("identity-meta").textContent = input.meta;
      };

      const logout = () => {
        window.ProjetoAlfaSession.logout("logged-out");
      };

      const showAccessDenied = (user) => {
        document.getElementById("market-layout").hidden = true;
        document.getElementById("market-state").hidden = true;
        document.getElementById("market-access-denied").hidden = false;
        setIdentity({
          email: user.email,
          meta: "Role: " + user.role + " | Status: " + user.status,
        });
        setAdminStatus("Acesso restrito a administradores.", "danger");
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
          setAdminStatus("Sessao validada. Carregando operacao do mercado...", "success");
          return true;
        } catch (error) {
          window.ProjetoAlfaSession.clear();
          const reason = error?.code === "unauthenticated" ? "expired" : "";
          redirectToLogin(reason);
          return false;
        }
      };

      const renderRows = (bodyId, emptyMessage, rows) => {
        const tbody = document.getElementById(bodyId);

        if (!rows.length) {
          const colSpan =
            bodyId === "user-orders-body" ? 7 :
            bodyId === "order-book-body" ? 5 :
            bodyId === "settlement-run-history-body" ? 5 :
            4;
          tbody.innerHTML = "<tr><td colspan=\\"" + colSpan + "\\" class=\\"empty-state\\">" + emptyMessage + "</td></tr>";
          return;
        }

        tbody.innerHTML = rows.join("");
      };

      const renderOrderBook = (orderBook) => {
        const rows = orderBook.levels.map((level) =>
          "<tr class=\\"row-" + level.side + "\\">" +
            "<td>" + level.side + "</td>" +
            "<td>" + level.outcome + "</td>" +
            "<td>" + level.price + "c</td>" +
            "<td>" + level.quantity + "</td>" +
            "<td>" + level.orderCount + "</td>" +
          "</tr>"
        );

        renderRows("order-book-body", "Sem niveis de book neste momento.", rows);
      };

      const renderTrades = (trades) => {
        recentTrades = trades.slice(0, 20);
        const rows = recentTrades.map((trade) =>
          "<tr>" +
            "<td>" + formatDate(trade.executedAt) + "</td>" +
            "<td>" + trade.price + "c</td>" +
            "<td>" + trade.quantity + "</td>" +
            "<td><code>" + trade.uuid + "</code></td>" +
          "</tr>"
        );

        renderRows("recent-trades-body", "Nenhuma execucao recente.", rows);
      };

      const renderUserOrders = (orders) => {
        const rows = orders.map((order) =>
          "<tr class=\\"row-" + order.side + "\\">" +
            "<td>" + order.side + "</td>" +
            "<td>" + order.outcome + "</td>" +
            "<td>" + order.status + "</td>" +
            "<td>" + order.price + "c</td>" +
            "<td>" + order.quantity + "</td>" +
            "<td>" + order.remainingQuantity + "</td>" +
            "<td>" + formatDate(order.createdAt) + "</td>" +
          "</tr>"
        );

        renderRows("user-orders-body", "Nenhuma ordem encontrada para este usuario neste mercado.", rows);
      };

      const renderResolutions = (resolutions) => {
        recentResolutions = resolutions.slice(0, 10);
        const rows = recentResolutions.map((resolution) =>
          "<tr>" +
            "<td>" + (resolution.status ?? "-") + "</td>" +
            "<td>" + (resolution.winningOutcome ?? "-") + "</td>" +
            "<td>" + (resolution.sourceValue ?? "-") + "</td>" +
            "<td>" + formatDate(resolution.resolvedAt ?? resolution.createdAt) + "</td>" +
          "</tr>"
        );

        renderRows("resolution-history-body", "Nenhuma resolucao registrada ainda.", rows);

        if (recentResolutions[0]) {
          document.getElementById("settlement-run-form").elements.marketResolutionUuid.value = recentResolutions[0].uuid;
        }
      };

      const renderSettlementRuns = (runs) => {
        recentSettlementRuns = runs.slice(0, 10);
        const rows = recentSettlementRuns.map((run) =>
          "<tr>" +
            "<td>" + run.status + "</td>" +
            "<td>" + run.contractsProcessed + "</td>" +
            "<td>$ " + run.totalPayout + "</td>" +
            "<td>" + formatDate(run.startedAt) + "</td>" +
            "<td><code>" + run.uuid + "</code></td>" +
          "</tr>"
        );

        renderRows("settlement-run-history-body", "Nenhum settlement run registrado ainda.", rows);
      };

      const fillMarket = (market) => {
        document.getElementById("market-title").textContent = market.title;
        document.getElementById("market-subtitle").textContent =
          "Uma leitura clara do contrato, do estado atual, do book e das ultimas execucoes do mercado.";
        document.getElementById("market-category").textContent = market.category;
        document.getElementById("market-outcome-type").textContent = market.outcomeType;
        document.getElementById("market-open-at").textContent = formatDate(market.openAt);
        document.getElementById("market-close-at").textContent = formatDate(market.closeAt);
        document.getElementById("market-contract-value").textContent = "$ " + market.contractValue + " por contrato";
        document.getElementById("market-contract-copy").textContent =
          "Tick size de " + market.tickSize + " centavo(s), estado " + market.status + ".";
        document.getElementById("market-source-label").textContent = market.rules.officialSourceLabel;
        document.getElementById("market-source-url").href = market.rules.officialSourceUrl;
        document.getElementById("market-source-url").textContent = market.rules.officialSourceUrl;
        document.getElementById("market-rules").textContent = market.rules.resolutionRules;

        const statusPill = document.getElementById("market-status-pill");
        statusPill.textContent = market.status;
        statusPill.dataset.status = market.status;

        const form = document.getElementById("market-form");
        form.elements.title.value = market.title;
        form.elements.slug.value = market.slug;
        form.elements.category.value = market.category;
        form.elements.status.value = market.status;
        form.elements.outcomeType.value = market.outcomeType;
        form.elements.tickSize.value = String(market.tickSize);
        form.elements.contractValue.value = market.contractValue;
        form.elements.openAt.value = toDatetimeLocal(market.openAt);
        form.elements.closeAt.value = toDatetimeLocal(market.closeAt);
        form.elements.officialSourceLabel.value = market.rules.officialSourceLabel;
        form.elements.officialSourceUrl.value = market.rules.officialSourceUrl;
        form.elements.resolutionRules.value = market.rules.resolutionRules;

        document.getElementById("market-state").hidden = true;
        document.getElementById("market-layout").hidden = false;
      };

      const loadMarket = async () => {
        const response = await fetch("/api/markets/" + marketUuid);

        if (!response.ok) {
          throw new Error("Nao foi possivel carregar o mercado.");
        }

        const payload = await response.json();
        fillMarket(payload.market);
      };

      const loadOrderBook = async () => {
        const payload = await fetchJson("/api/markets/" + marketUuid + "/book");
        renderOrderBook(payload.orderBook);
      };

      const loadRecentTrades = async () => {
        const payload = await fetchJson("/api/markets/" + marketUuid + "/trades?limit=20");
        renderTrades(payload.items ?? []);
      };

      const loadUserOrders = async () => {
        if (!window.ProjetoAlfaSession.getAccessToken()) {
          renderUserOrders([]);
          return;
        }

        try {
          const payload = await fetchJson("/api/orders?marketUuid=" + encodeURIComponent(marketUuid) + "&limit=20");
          renderUserOrders(payload.items ?? []);
        } catch (error) {
          setAdminStatus(error.message, "danger");
          renderUserOrders([]);
        }
      };

      const loadResolutions = async () => {
        if (!window.ProjetoAlfaSession.getAccessToken()) {
          renderResolutions([]);
          return;
        }

        try {
          const payload = await fetchJson("/api/admin/markets/" + marketUuid + "/resolutions");
          renderResolutions(payload.items ?? []);
        } catch (error) {
          setAdminStatus(error.message, "danger");
          renderResolutions([]);
        }
      };

      const loadSettlementRuns = async () => {
        if (!window.ProjetoAlfaSession.getAccessToken()) {
          renderSettlementRuns([]);
          return;
        }

        try {
          const payload = await fetchJson("/api/admin/markets/" + marketUuid + "/settlement-runs");
          renderSettlementRuns(payload.items ?? []);
        } catch (error) {
          setAdminStatus(error.message, "danger");
          renderSettlementRuns([]);
        }
      };

      const submitUpdate = async (override = {}) => {
        const form = document.getElementById("market-form");
        const formData = new FormData(form);
        const payload = {
          title: String(formData.get("title") ?? "").trim(),
          slug: String(formData.get("slug") ?? "").trim(),
          category: String(formData.get("category") ?? "").trim(),
          status: String(formData.get("status") ?? "").trim(),
          outcomeType: String(formData.get("outcomeType") ?? "").trim(),
          tickSize: Number(formData.get("tickSize") ?? 1),
          contractValue: String(formData.get("contractValue") ?? "1").trim(),
          openAt: formData.get("openAt") ? new Date(String(formData.get("openAt"))).toISOString() : null,
          closeAt: new Date(String(formData.get("closeAt"))).toISOString(),
          officialSourceLabel: String(formData.get("officialSourceLabel") ?? "").trim(),
          officialSourceUrl: String(formData.get("officialSourceUrl") ?? "").trim(),
          resolutionRules: String(formData.get("resolutionRules") ?? "").trim(),
          ...override,
        };

        setAdminStatus("Salvando alteracoes...");

        try {
          const result = await fetchJson("/api/admin/markets/" + marketUuid, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
          fillMarket(result.market);
          setAdminStatus("Mercado atualizado com sucesso.", "success");
        } catch (error) {
          setAdminStatus(error.message, "danger");
        }
      };

      const submitResolution = async () => {
        const form = document.getElementById("resolution-form");
        const formData = new FormData(form);
        const winningOutcome = String(formData.get("winningOutcome") ?? "").trim();
        const payload = {
          status: String(formData.get("status") ?? "pending").trim(),
          winningOutcome: winningOutcome ? winningOutcome : null,
          sourceValue: String(formData.get("sourceValue") ?? "").trim() || null,
          notes: String(formData.get("notes") ?? "").trim() || null,
        };

        setAdminStatus("Registrando resolucao manual...");

        try {
          await fetchJson("/api/admin/markets/" + marketUuid + "/resolutions", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          await Promise.all([loadMarket(), loadResolutions()]);
          setAdminStatus("Resolucao registrada com sucesso.", "success");
        } catch (error) {
          setAdminStatus(error.message, "danger");
        }
      };

      const readSettlementRunPayload = () => {
        const form = document.getElementById("settlement-run-form");
        const formData = new FormData(form);
        const metadataRaw = String(formData.get("metadata") ?? "").trim();

        return {
          marketResolutionUuid: String(formData.get("marketResolutionUuid") ?? "").trim(),
          status: String(formData.get("status") ?? "pending").trim(),
          contractsProcessed: Number(formData.get("contractsProcessed") ?? 0),
          totalPayout: String(formData.get("totalPayout") ?? "0").trim(),
          metadata: metadataRaw ? JSON.parse(metadataRaw) : undefined,
        };
      };

      const createSettlementRun = async () => {
        setAdminStatus("Criando settlement run...");

        try {
          const payload = readSettlementRunPayload();
          await fetchJson("/api/admin/markets/" + marketUuid + "/settlement-runs", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          await loadSettlementRuns();
          setAdminStatus("Settlement run criado com sucesso.", "success");
        } catch (error) {
          setAdminStatus(error.message, "danger");
        }
      };

      const updateLatestSettlementRun = async () => {
        if (!recentSettlementRuns[0]) {
          setAdminStatus("Nao existe settlement run para atualizar.", "danger");
          return;
        }

        setAdminStatus("Atualizando o ultimo settlement run...");

        try {
          const payload = readSettlementRunPayload();
          await fetchJson("/api/admin/settlement-runs/" + recentSettlementRuns[0].uuid, {
            method: "PATCH",
            body: JSON.stringify({
              status: payload.status,
              contractsProcessed: payload.contractsProcessed,
              totalPayout: payload.totalPayout,
              metadata: payload.metadata,
            }),
          });
          await loadSettlementRuns();
          setAdminStatus("Settlement run atualizado com sucesso.", "success");
        } catch (error) {
          setAdminStatus(error.message, "danger");
        }
      };

      const executeLatestSettlementRun = async () => {
        if (!recentSettlementRuns[0]) {
          setAdminStatus("Nao existe settlement run para executar.", "danger");
          return;
        }

        setAdminStatus("Executando o ultimo settlement run...");

        try {
          await fetchJson("/api/admin/settlement-runs/" + recentSettlementRuns[0].uuid + "/execute", {
            method: "POST",
          });
          await Promise.all([loadSettlementRuns(), loadMarket()]);
          setAdminStatus("Settlement run executado com sucesso.", "success");
        } catch (error) {
          setAdminStatus(error.message, "danger");
        }
      };

      const connectRealtime = () => {
        if (liveSocket) {
          liveSocket.close();
        }

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const socketUrl = protocol + "//" + window.location.host.replace(":3000", ":4000") + "/realtime";
        liveSocket = new WebSocket(socketUrl);
        setSocketStatus("connecting", "Conectando realtime");

        liveSocket.addEventListener("open", () => {
          setSocketStatus("connected", "Realtime conectado");
          liveSocket.send(JSON.stringify({ action: "subscribe", channel: "market:" + marketUuid + ":book" }));
          liveSocket.send(JSON.stringify({ action: "subscribe", channel: "market:" + marketUuid + ":trades" }));
        });

        liveSocket.addEventListener("message", (event) => {
          try {
            const payload = JSON.parse(event.data);

            if (payload.type !== "event") {
              return;
            }

            if (payload.channel === "market:" + marketUuid + ":book" && payload.payload?.orderBook) {
              renderOrderBook(payload.payload.orderBook);
            }

            if (payload.channel === "market:" + marketUuid + ":trades" && payload.payload?.trade) {
              renderTrades([payload.payload.trade, ...recentTrades]);
            }
          } catch {
            setSocketStatus("offline", "Realtime com payload invalido");
          }
        });

        liveSocket.addEventListener("close", () => {
          setSocketStatus("offline", "Realtime desconectado");
        });

        liveSocket.addEventListener("error", () => {
          setSocketStatus("offline", "Realtime indisponivel");
        });
      };

      document.getElementById("refresh-orders").addEventListener("click", loadUserOrders);
      document.getElementById("logout-button").addEventListener("click", logout);
      document.getElementById("refresh-resolution-data").addEventListener("click", async () => {
        await Promise.all([loadResolutions(), loadSettlementRuns()]);
      });
      document.getElementById("market-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        await submitUpdate();
      });
      document.getElementById("resolution-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        await submitResolution();
      });
      document.getElementById("create-settlement-run").addEventListener("click", createSettlementRun);
      document.getElementById("update-latest-settlement-run").addEventListener("click", updateLatestSettlementRun);
      document.getElementById("execute-latest-settlement-run").addEventListener("click", executeLatestSettlementRun);
      document.getElementById("suspend-market").addEventListener("click", async () => {
        await submitUpdate({ status: "suspended" });
      });
      document.getElementById("close-market").addEventListener("click", async () => {
        await submitUpdate({ status: "closed" });
      });

      bootstrapSession()
        .then((isAuthenticated) => {
          if (!isAuthenticated) {
            return;
          }

          return Promise.all([
            loadMarket(),
            loadOrderBook(),
            loadRecentTrades(),
            loadUserOrders(),
            loadResolutions(),
            loadSettlementRuns(),
          ]).then(() => connectRealtime());
        })
        .catch((error) => setError(error.message));
    </script>
  </body>
</html>`;
};
