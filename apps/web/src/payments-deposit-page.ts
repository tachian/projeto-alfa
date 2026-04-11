import { escapeHtml } from "./html.js";
import { renderWalletHeaderScript, renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderPaymentsDepositPage = (input: {
  appName: string;
  pathname: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Depositar | ${escapeHtml(input.appName)}</title>
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

      .hero {
        padding: 32px;
      }

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
        grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
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
      .instruction-card,
      .method-card,
      .form-card {
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
      .form-actions button {
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

      .summary-value {
        font-size: 1.6rem;
        letter-spacing: -0.04em;
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
      select,
      textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 14px 16px;
        font: inherit;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.92);
      }

      textarea {
        min-height: 120px;
        resize: vertical;
      }

      .form-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }

      .form-actions button {
        color: white;
        background: linear-gradient(135deg, var(--accent), #0f766e);
      }

      .methods {
        display: grid;
        gap: 14px;
      }

      .method-card.active {
        border-color: rgba(3, 105, 161, 0.22);
        background: linear-gradient(135deg, rgba(3, 105, 161, 0.1), rgba(15, 118, 110, 0.06));
      }

      .method-badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 6px 10px;
        background: rgba(3, 105, 161, 0.1);
        color: #0369a1;
        font-size: 0.8rem;
        font-weight: 700;
      }

      .instruction-card ul {
        margin: 14px 0 0;
        padding-left: 18px;
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
            <h1>Entrada de recursos pronta para evoluir para PIX.</h1>
            <p>O portal trata deposito como uma trilha propria: escolha o metodo, siga as instrucoes e acompanhe o reflexo imediato na carteira sem misturar cash-in com trading.</p>
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
        <div class="eyebrow">Deposito</div>
        <h2>Crie uma entrada para a carteira</h2>
        <p>Hoje o fluxo usa confirmacao imediata no ambiente local, mas a interface ja foi estruturada para receber instrucoes dinamicas por metodo e status assincronos no futuro.</p>

        <div id="deposit-status" class="status">Carregando carteira e metodo de deposito...</div>

        <div class="summary-grid" style="margin-top: 18px;">
          <article class="summary-card">
            <div class="summary-label">Disponivel</div>
            <div id="wallet-available" class="summary-value">-</div>
            <div class="summary-note">Saldo pronto para operar</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Total</div>
            <div id="wallet-total" class="summary-value">-</div>
            <div id="wallet-currency" class="summary-note">Moeda da carteira</div>
          </article>
        </div>

        <div class="content-grid" style="margin-top: 18px;">
          <article class="form-card">
            <form id="deposit-form">
              <div class="field-grid">
                <label>
                  Metodo
                  <select id="deposit-method" name="method">
                    <option value="manual_mock">Ambiente local</option>
                  </select>
                </label>

                <label>
                  Moeda
                  <input id="deposit-currency" name="currency" type="text" value="USD" maxlength="3" />
                </label>

                <label>
                  Valor
                  <input id="deposit-amount" name="amount" type="number" min="0.01" step="0.01" placeholder="100.00" />
                </label>

                <label>
                  Chave de idempotencia
                  <input id="deposit-idempotency" name="idempotencyKey" type="text" placeholder="Opcional" />
                </label>
              </div>

              <label>
                Descricao
                <textarea id="deposit-description" name="description" placeholder="Ex.: Recarga para operar no portal"></textarea>
              </label>

              <div class="form-actions">
                <div id="deposit-inline-status" class="summary-note">Revise valor, metodo e descricao antes de confirmar.</div>
                <button id="deposit-submit" type="submit">Confirmar deposito</button>
              </div>
            </form>
          </article>

          <div class="methods">
            <article id="method-card-manual" class="method-card active">
              <div class="method-badge">Disponivel agora</div>
              <h2 style="margin-top: 12px;">Ambiente local</h2>
              <p>Completa o deposito imediatamente para acelerar testes de carteira, trading e portfolio sem depender de integracao externa.</p>
            </article>

            <article class="instruction-card">
              <div class="eyebrow">Instrucoes</div>
              <h2 id="instruction-title" style="margin-top: 10px;">Fluxo manual de desenvolvimento</h2>
              <ul id="instruction-list">
                <li>O valor enviado entra direto na carteira disponivel.</li>
                <li>Use a chave de idempotencia para evitar duplicidade acidental.</li>
                <li>Esta trilha sera reaproveitada no futuro para PIX, QR Code ou checkout externo.</li>
              </ul>
              <div class="action-links">
                <a class="action-link primary" href="/wallet">Abrir carteira</a>
                <a class="action-link" href="/payments">Voltar para movimentacoes</a>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}
      ${renderWalletHeaderScript()}

      const sessionClient = window.ProjetoAlfaWebSession;
      const syncWalletHeader = window.ProjetoAlfaWebSyncWalletHeader;
      const identityName = document.getElementById("identity-name");
      const identityMeta = document.getElementById("identity-meta");
      const logoutButton = document.getElementById("logout-button");
      const depositStatus = document.getElementById("deposit-status");
      const depositInlineStatus = document.getElementById("deposit-inline-status");
      const depositForm = document.getElementById("deposit-form");
      const depositMethodInput = document.getElementById("deposit-method");
      const depositCurrencyInput = document.getElementById("deposit-currency");
      const depositAmountInput = document.getElementById("deposit-amount");
      const depositIdempotencyInput = document.getElementById("deposit-idempotency");
      const depositDescriptionInput = document.getElementById("deposit-description");
      const depositSubmitButton = document.getElementById("deposit-submit");
      const walletAvailable = document.getElementById("wallet-available");
      const walletTotal = document.getElementById("wallet-total");
      const walletCurrency = document.getElementById("wallet-currency");

      const setStatus = (message, tone = "default") => {
        depositStatus.dataset.tone = tone;
        depositStatus.textContent = message;
      };

      const setInlineStatus = (message) => {
        depositInlineStatus.textContent = message;
      };

      const formatAmount = (value, currency) => {
        const amount = Number(value || 0);
        const normalized = Number.isFinite(amount) ? amount.toFixed(2) : String(value || "0.00");
        return currency ? normalized + " " + currency : normalized;
      };

      const paintIdentity = (user) => {
        identityName.textContent = user.name || user.email;
        identityMeta.textContent = [user.email, user.phone || "telefone em breve", user.status].join(" • ");
      };

      const paintBalance = (balance) => {
        walletAvailable.textContent = formatAmount(balance.available, balance.currency);
        walletTotal.textContent = formatAmount(balance.total, balance.currency);
        walletCurrency.textContent = "Contas em " + (balance.currency || "USD");
      };

      const validateForm = () => {
        const method = depositMethodInput.value.trim();
        const currency = depositCurrencyInput.value.trim().toUpperCase();
        const amount = Number(depositAmountInput.value);

        if (!method) {
          return "Escolha um metodo de deposito.";
        }

        if (currency.length !== 3) {
          return "Informe uma moeda com 3 letras.";
        }

        if (!Number.isFinite(amount) || amount <= 0) {
          return "Informe um valor maior que zero para o deposito.";
        }

        return "";
      };

      const loadBalance = async () => {
        const payload = await sessionClient.fetchJsonWithAuth("/api/wallet/balance", {
          method: "GET",
        }, "Nao foi possivel carregar seu saldo.");

        if (payload?.balance) {
          paintBalance(payload.balance);
        }
      };

      const loadContext = async () => {
        setStatus("Carregando carteira e metodo de deposito...");

        try {
          const [user] = await Promise.all([
            sessionClient.resolveUser(),
            loadBalance(),
          ]);

          paintIdentity(user);
          setStatus("Escolha o valor e confirme o deposito.", "success");
          setInlineStatus("O deposito sera refletido imediatamente na carteira neste ambiente.");
        } catch (error) {
          if (error?.code === "unauthenticated") {
            sessionClient.redirectToLogin("expired");
            return;
          }

          setStatus(error?.message || "Nao foi possivel preparar a tela de deposito.", "danger");
        }
      };

      depositForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const validationMessage = validateForm();

        if (validationMessage) {
          setStatus(validationMessage, "danger");
          return;
        }

        depositSubmitButton.disabled = true;
        setStatus("Criando deposito e atualizando carteira...");
        setInlineStatus("Processando deposito...");

        const method = depositMethodInput.value.trim();
        const currency = depositCurrencyInput.value.trim().toUpperCase();
        const amount = Number(depositAmountInput.value).toFixed(2);
        const idempotencyKey = depositIdempotencyInput.value.trim();
        const description = depositDescriptionInput.value.trim();

        try {
          const response = await sessionClient.fetchWithAuth("/api/payments/deposits", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
            },
            body: JSON.stringify({
              amount,
              currency,
              method,
              description: description || undefined,
            }),
          });

          const payloadText = await response.text();
          const payload = payloadText ? JSON.parse(payloadText) : null;

          if (!response.ok) {
            if (response.status === 401) {
              sessionClient.redirectToLogin("expired");
              return;
            }

            throw new Error(payload?.message || "Nao foi possivel concluir o deposito.");
          }

          await loadBalance();
          if (typeof syncWalletHeader === "function") {
            await syncWalletHeader();
          }

          depositAmountInput.value = "";
          depositDescriptionInput.value = "";
          setStatus("Deposito concluido com sucesso. O saldo ja foi atualizado na carteira.", "success");
          setInlineStatus("Deposito " + (payload?.payment?.uuid || "processado") + " concluido.");
        } catch (error) {
          setStatus(error?.message || "Nao foi possivel concluir o deposito.", "danger");
          setInlineStatus("Revise os dados ou tente novamente.");
        } finally {
          depositSubmitButton.disabled = false;
        }
      });

      logoutButton.addEventListener("click", () => {
        sessionClient.logout();
      });

      loadContext();
    </script>
  </body>
</html>`;
