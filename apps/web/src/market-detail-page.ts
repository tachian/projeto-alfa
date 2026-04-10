import { escapeHtml } from "./html.js";
import { renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderMarketDetailPage = (input: {
  appName: string;
  pathname: string;
  marketUuid: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mercado | ${escapeHtml(input.appName)}</title>
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

      .hero,
      .panel {
        padding: 28px;
      }

      .hero-grid,
      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
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
        font-size: clamp(2.4rem, 5vw, 4rem);
        line-height: 0.95;
        max-width: 11ch;
      }

      p, li {
        color: var(--muted);
        line-height: 1.7;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 7px 12px;
        background: rgba(3, 105, 161, 0.1);
        color: #0369a1;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .status {
        margin-top: 16px;
        min-height: 24px;
        color: var(--muted);
      }

      .status[data-tone="danger"] { color: #b42318; }

      .panel {
        margin-top: 22px;
      }

      .stack {
        display: grid;
        gap: 18px;
      }

      .box {
        padding: 18px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.78);
      }

      .box ul {
        margin: 14px 0 0;
        padding-left: 20px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
      }

      th, td {
        padding: 10px 0;
        border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        text-align: left;
        font-size: 0.95rem;
      }

      a.button-link {
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

      form {
        margin-top: 18px;
        display: grid;
        gap: 14px;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
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

      .form-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }

      .form-actions button {
        border: 0;
        border-radius: 999px;
        padding: 12px 16px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        color: white;
        background: linear-gradient(135deg, var(--accent), #0f766e);
      }

      .trade-status {
        min-height: 24px;
        color: var(--muted);
      }

      .trade-status[data-tone="success"] { color: var(--success); }
      .trade-status[data-tone="danger"] { color: var(--danger); }

      @media (max-width: 980px) {
        .hero-grid,
        .content-grid,
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
            <div class="eyebrow">Mercado</div>
            <h1 id="market-title">Carregando contrato...</h1>
            <p id="market-description">Estamos consultando detalhes, regras, book e ultimas execucoes deste mercado.</p>
            <div id="market-chips" class="chips"></div>
            <div id="market-status" class="status">Consultando mercado...</div>
          </div>
          <aside class="box">
            <div class="eyebrow">Operacao</div>
            <h2>Enviar ordem neste mercado</h2>
            <p>Entre com sua conta para enviar uma ordem buy ou sell sem sair do contexto do contrato.</p>

            <form id="trade-form">
              <div class="field-grid">
                <label>
                  Lado
                  <select id="trade-side" name="side">
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </label>

                <label>
                  Outcome
                  <select id="trade-outcome" name="outcome">
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </label>

                <label>
                  Preco
                  <input id="trade-price" name="price" type="number" min="1" max="99" value="50" required />
                </label>

                <label>
                  Quantidade
                  <input id="trade-quantity" name="quantity" type="number" min="1" value="1" required />
                </label>
              </div>

              <div class="form-actions">
                <div id="trade-status" class="trade-status">Entre para operar diretamente desta pagina.</div>
                <button id="trade-submit" type="submit">Enviar ordem</button>
              </div>
            </form>

            <a class="button-link" href="/orders">Ver area de ordens</a>
          </aside>
        </div>
      </section>

      <section class="panel">
        <div class="content-grid">
          <div class="stack">
            <article class="box">
              <div class="eyebrow">Regras</div>
              <h3>Resolucao do mercado</h3>
              <p id="resolution-rules">Carregando regras...</p>
            </article>

            <article class="box">
              <div class="eyebrow">Order Book</div>
              <h3>Profundidade por preco</h3>
              <div id="order-book">Carregando order book...</div>
            </article>
          </div>

          <div class="stack">
            <article class="box">
              <div class="eyebrow">Fonte oficial</div>
              <h3>Referencia do contrato</h3>
              <p id="official-source">Carregando fonte oficial...</p>
            </article>

            <article class="box">
              <div class="eyebrow">Ultimas execucoes</div>
              <h3>Trades recentes</h3>
              <div id="market-trades">Carregando trades...</div>
            </article>
          </div>
        </div>
      </section>

      <script>
        ${renderSessionClientScript()}

        const marketUuid = ${JSON.stringify(input.marketUuid)};
        const sessionClient = window.ProjetoAlfaWebSession;
        const titleNode = document.getElementById("market-title");
        const descriptionNode = document.getElementById("market-description");
        const chipsNode = document.getElementById("market-chips");
        const statusNode = document.getElementById("market-status");
        const rulesNode = document.getElementById("resolution-rules");
        const sourceNode = document.getElementById("official-source");
        const bookNode = document.getElementById("order-book");
        const tradesNode = document.getElementById("market-trades");
        const tradeForm = document.getElementById("trade-form");
        const tradeStatusNode = document.getElementById("trade-status");
        const tradeSubmitButton = document.getElementById("trade-submit");
        const tradeSideInput = document.getElementById("trade-side");
        const tradeOutcomeInput = document.getElementById("trade-outcome");
        const tradePriceInput = document.getElementById("trade-price");
        const tradeQuantityInput = document.getElementById("trade-quantity");
        let marketIsTradable = true;

        const setStatus = (message, tone = "default") => {
          statusNode.dataset.tone = tone;
          statusNode.textContent = message;
        };

        const setTradeStatus = (message, tone = "default") => {
          tradeStatusNode.dataset.tone = tone;
          tradeStatusNode.textContent = message;
        };

        const setTradeAvailability = (isTradable, message) => {
          marketIsTradable = isTradable;
          tradeSubmitButton.disabled = !isTradable;
          if (message) {
            setTradeStatus(message, isTradable ? "default" : "danger");
          }
        };

        const validateTradeForm = () => {
          const price = Number(tradePriceInput.value);
          const quantity = Number(tradeQuantityInput.value);

          if (!Number.isInteger(price) || price < 1 || price > 99) {
            return "Preco invalido. Use um inteiro entre 1 e 99.";
          }

          if (!Number.isInteger(quantity) || quantity < 1) {
            return "Quantidade invalida. Use um inteiro maior ou igual a 1.";
          }

          return "";
        };

        const renderBook = (levels) => {
          if (!levels.length) {
            return "<p>Nenhuma ordem aberta neste mercado no momento.</p>";
          }

          return [
            "<table>",
              "<thead><tr><th>Lado</th><th>Outcome</th><th>Preco</th><th>Qtd</th><th>Ordens</th></tr></thead>",
              "<tbody>",
                levels.map((level) => (
                  "<tr>" +
                    "<td>" + level.side + "</td>" +
                    "<td>" + level.outcome + "</td>" +
                    "<td>" + level.price + "</td>" +
                    "<td>" + level.quantity + "</td>" +
                    "<td>" + level.orderCount + "</td>" +
                  "</tr>"
                )).join(""),
              "</tbody>",
            "</table>"
          ].join("");
        };

        const renderTrades = (items) => {
          if (!items.length) {
            return "<p>Nenhuma execucao registrada ainda.</p>";
          }

          return [
            "<table>",
              "<thead><tr><th>Preco</th><th>Qtd</th><th>Executado em</th></tr></thead>",
              "<tbody>",
                items.map((trade) => (
                  "<tr>" +
                    "<td>" + trade.price + "</td>" +
                    "<td>" + trade.quantity + "</td>" +
                    "<td>" + new Date(trade.executedAt).toLocaleString("pt-BR") + "</td>" +
                  "</tr>"
                )).join(""),
              "</tbody>",
            "</table>"
          ].join("");
        };

        const loadMarket = async () => {
          try {
            const [marketResponse, bookResponse, tradesResponse] = await Promise.all([
              fetch("/api/markets/" + marketUuid),
              fetch("/api/markets/" + marketUuid + "/book"),
              fetch("/api/markets/" + marketUuid + "/trades?limit=20"),
            ]);

            const [marketText, bookText, tradesText] = await Promise.all([
              marketResponse.text(),
              bookResponse.text(),
              tradesResponse.text(),
            ]);

            const marketPayload = marketText ? JSON.parse(marketText) : null;
            const bookPayload = bookText ? JSON.parse(bookText) : null;
            const tradesPayload = tradesText ? JSON.parse(tradesText) : null;

            if (!marketResponse.ok) {
              setStatus(marketPayload?.message || "Nao foi possivel carregar o mercado.", "danger");
              titleNode.textContent = "Mercado indisponivel";
              return;
            }

            const market = marketPayload.market;
            titleNode.textContent = market.title;
            descriptionNode.textContent = "Fecha em " + new Date(market.closeAt).toLocaleString("pt-BR") + ". Valor do contrato: " + market.contractValue + ".";
            chipsNode.innerHTML = [
              '<span class="chip">' + market.status + '</span>',
              '<span class="chip">' + market.category + '</span>',
              '<span class="chip">' + market.outcomeType + '</span>',
              '<span class="chip">tick ' + market.tickSize + '</span>'
            ].join("");
            rulesNode.textContent = market.rules?.resolutionRules || "Regras nao informadas.";

            if (market.rules?.officialSourceUrl) {
              sourceNode.innerHTML = '<strong>' + (market.rules.officialSourceLabel || "Fonte oficial") + '</strong><br /><a href="' + market.rules.officialSourceUrl + '" target="_blank" rel="noreferrer">' + market.rules.officialSourceUrl + '</a>';
            } else {
              sourceNode.textContent = "Fonte oficial nao informada.";
            }

            bookNode.innerHTML = bookResponse.ok ? renderBook(bookPayload.orderBook?.levels || []) : "<p>Nao foi possivel carregar o order book.</p>";
            tradesNode.innerHTML = tradesResponse.ok ? renderTrades(tradesPayload.items || []) : "<p>Nao foi possivel carregar as ultimas execucoes.</p>";

            setStatus("Mercado carregado com sucesso.");
            if (market.status === "open") {
              setTradeAvailability(true, "Sessao sera validada ao enviar a ordem. Use este formulario para operar no contexto do mercado.");
            } else {
              setTradeAvailability(false, "Este mercado esta em status " + market.status + " e nao aceita novas ordens agora.");
            }
          } catch {
            titleNode.textContent = "Mercado indisponivel";
            setStatus("Nao foi possivel carregar o detalhe deste mercado.", "danger");
            setTradeAvailability(false, "O mercado nao pode ser operado enquanto os dados estiverem indisponiveis.");
          }
        };

        tradeForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (!marketIsTradable) {
            setTradeStatus("Este mercado nao aceita novas ordens no momento.", "danger");
            return;
          }

          tradeSubmitButton.disabled = true;
          setTradeStatus("Validando sessao e enviando ordem...");

          const validationMessage = validateTradeForm();

          if (validationMessage) {
            tradeSubmitButton.disabled = false;
            setTradeStatus(validationMessage, "danger");
            return;
          }

          try {
            await sessionClient.resolveUser();

            await sessionClient.fetchJsonWithAuth("/api/orders", {
              method: "POST",
              body: JSON.stringify({
                marketUuid,
                side: tradeSideInput.value,
                outcome: tradeOutcomeInput.value,
                price: Number(tradePriceInput.value),
                quantity: Number(tradeQuantityInput.value),
              }),
            }, "Nao foi possivel enviar a ordem.");

            setTradeStatus("Ordem enviada com sucesso. Atualizando book e ultimas execucoes...", "success");
            await loadMarket();
          } catch (error) {
            if (error?.code === "unauthenticated") {
              sessionClient.redirectToLogin("expired");
              return;
            }

            setTradeStatus(error?.message || "Nao foi possivel enviar a ordem.", "danger");
          } finally {
            tradeSubmitButton.disabled = false;
          }
        });

        loadMarket();
      </script>
    </main>
  </body>
</html>`;
