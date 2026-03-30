const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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
        --panel: rgba(255, 251, 245, 0.86);
        --panel-strong: #fffaf3;
        --ink: #1b1510;
        --muted: #6d5f4f;
        --line: rgba(50, 34, 19, 0.14);
        --accent: #b14d2d;
        --accent-soft: #efc7ae;
        --success: #276749;
        --warning: #8a5b17;
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
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
        padding: 40px 0 64px;
      }

      .hero {
        position: relative;
        overflow: hidden;
        padding: 32px;
        border: 1px solid rgba(98, 60, 28, 0.12);
        border-radius: 28px;
        background:
          linear-gradient(135deg, rgba(255, 251, 245, 0.96), rgba(248, 232, 214, 0.88)),
          var(--panel);
        box-shadow: var(--shadow);
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
        font-size: clamp(2.4rem, 5vw, 4.5rem);
        line-height: 0.92;
        max-width: 12ch;
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

      .grid {
        display: grid;
        grid-template-columns: 1.45fr 0.95fr;
        gap: 18px;
        margin-top: 22px;
      }

      .panel {
        border-radius: 24px;
        border: 1px solid var(--line);
        background: var(--panel);
        backdrop-filter: blur(12px);
        box-shadow: 0 18px 48px rgba(74, 47, 23, 0.08);
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

      .stat {
        padding: 16px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.58);
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

      .pill[data-status="open"] {
        color: var(--success);
        background: rgba(39, 103, 73, 0.12);
      }

      .pill[data-status="draft"],
      .pill[data-status="suspended"] {
        color: var(--warning);
        background: rgba(138, 91, 23, 0.12);
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

      .loading {
        display: grid;
        place-items: center;
        min-height: 240px;
        color: var(--muted);
      }

      .loading::after {
        content: "";
        width: 40px;
        height: 40px;
        border-radius: 999px;
        border: 3px solid rgba(177, 77, 45, 0.14);
        border-top-color: var(--accent);
        animation: spin 1s linear infinite;
        margin-top: 14px;
      }

      .error-card {
        margin-top: 22px;
        padding: 18px 20px;
        border-radius: 18px;
        border: 1px solid rgba(154, 44, 26, 0.14);
        background: rgba(255, 241, 236, 0.8);
        color: #7f2d18;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 860px) {
        .grid {
          grid-template-columns: 1fr;
        }

        .hero {
          padding: 24px;
        }

        .panel-body {
          padding: 20px;
        }

        .meta-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div class="eyebrow">${safeAppName}</div>
        <h1 id="market-title">Carregando mercado</h1>
        <p class="subtitle" id="market-subtitle">
          Estamos buscando as regras, a fonte oficial e o estado atual deste mercado.
        </p>
        <div class="market-id">UUID do mercado: <strong>${safeMarketUuid}</strong></div>
      </section>

      <div id="market-state" class="loading">Montando a ficha completa do mercado...</div>
      <section id="market-layout" class="grid" hidden>
        <article class="panel">
          <div class="panel-body">
            <span class="pill" id="market-status-pill">status</span>
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

        <aside class="panel">
          <div class="panel-body">
            <div class="eyebrow">Contrato</div>
            <h2 id="market-contract-value">$ 0,00</h2>
            <p class="section-copy" id="market-contract-copy">
              Cada contrato liquida conforme as regras oficiais abaixo.
            </p>
          </div>
        </aside>

        <article class="panel">
          <div class="panel-body">
            <div class="eyebrow">Fonte Oficial</div>
            <h2 id="market-source-label">-</h2>
            <p class="section-copy">
              A resolução depende exclusivamente da fonte oficial configurada para este mercado.
            </p>
            <a id="market-source-url" class="source-link" href="#" target="_blank" rel="noreferrer">
              Abrir fonte oficial
            </a>
          </div>
        </article>

        <article class="panel">
          <div class="panel-body">
            <div class="eyebrow">Regras</div>
            <h2>Como este mercado resolve</h2>
            <p class="section-copy" id="market-rules">-</p>
          </div>
        </article>
      </section>
    </main>

    <script>
      const marketUuid = ${JSON.stringify(input.marketUuid)};
      const formatDate = (value) => {
        if (!value) return "Nao definido";
        return new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "medium",
          timeStyle: "short"
        }).format(new Date(value));
      };

      const setError = (message) => {
        const state = document.getElementById("market-state");
        state.className = "error-card";
        state.textContent = message;
      };

      const fillMarket = (market) => {
        document.getElementById("market-title").textContent = market.title;
        document.getElementById("market-subtitle").textContent =
          "Uma leitura clara do contrato, do estado atual e da fonte oficial usada na resolucao.";
        document.getElementById("market-category").textContent = market.category;
        document.getElementById("market-outcome-type").textContent = market.outcomeType;
        document.getElementById("market-open-at").textContent = formatDate(market.openAt);
        document.getElementById("market-close-at").textContent = formatDate(market.closeAt);
        document.getElementById("market-contract-value").textContent =
          "$ " + market.contractValue + " por contrato";
        document.getElementById("market-contract-copy").textContent =
          "Tick size de " + market.tickSize + " centavo(s), estado " + market.status + ".";
        document.getElementById("market-source-label").textContent = market.rules.officialSourceLabel;
        document.getElementById("market-source-url").href = market.rules.officialSourceUrl;
        document.getElementById("market-source-url").textContent = market.rules.officialSourceUrl;
        document.getElementById("market-rules").textContent = market.rules.resolutionRules;

        const statusPill = document.getElementById("market-status-pill");
        statusPill.textContent = market.status;
        statusPill.dataset.status = market.status;

        document.getElementById("market-state").hidden = true;
        document.getElementById("market-layout").hidden = false;
      };

      fetch("/api/markets/" + marketUuid)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Nao foi possivel carregar o mercado.");
          }

          return response.json();
        })
        .then((payload) => fillMarket(payload.market))
        .catch((error) => setError(error.message));
    </script>
  </body>
</html>`;
};
