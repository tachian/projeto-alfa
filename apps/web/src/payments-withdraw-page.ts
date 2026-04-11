import { escapeHtml } from "./html.js";
import { renderWalletHeaderScript, renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderPaymentsWithdrawPage = (input: {
  appName: string;
  pathname: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sacar | ${escapeHtml(input.appName)}</title>
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
        background: linear-gradient(135deg, #0f766e, #0369a1);
      }

      .methods {
        display: grid;
        gap: 14px;
      }

      .method-card.active {
        border-color: rgba(15, 118, 110, 0.22);
        background: linear-gradient(135deg, rgba(15, 118, 110, 0.1), rgba(3, 105, 161, 0.06));
      }

      .method-badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 6px 10px;
        background: rgba(15, 118, 110, 0.12);
        color: #0f766e;
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
        background: linear-gradient(135deg, #0f766e, #0369a1);
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
            <h1>Retirada com contexto de saldo e limites atuais.</h1>
            <p>O portal separa o saque da carteira e do trading para deixar claro o que esta disponivel, o que esta reservado e quais validacoes precisam passar antes da retirada.</p>
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
        <div class="eyebrow">Saque</div>
        <h2>Solicite uma retirada da carteira</h2>
        <p>Hoje o fluxo ainda opera em ambiente local, mas a tela ja foi estruturada para evoluir para parceiros reais de cash-out, instrucoes dinamicas e conciliacao por status.</p>

        <div id="withdraw-status" class="status">Carregando carteira, contexto de saque e validacoes...</div>

        <div class="summary-grid" style="margin-top: 18px;">
          <article class="summary-card">
            <div class="summary-label">Disponivel</div>
            <div id="wallet-available" class="summary-value">-</div>
            <div class="summary-note">Valor elegivel para saque</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Reservado</div>
            <div id="wallet-reserved" class="summary-value">-</div>
            <div class="summary-note">Ordens abertas nao podem ser retiradas</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Total</div>
            <div id="wallet-total" class="summary-value">-</div>
            <div id="wallet-currency" class="summary-note">Moeda da carteira</div>
          </article>
          <article class="summary-card">
            <div class="summary-label">Observacao</div>
            <div id="withdraw-limit-note" class="summary-value">-</div>
            <div class="summary-note">Cheque limites e status da conta</div>
          </article>
        </div>

        <div class="content-grid" style="margin-top: 18px;">
          <article class="form-card">
            <form id="withdraw-form">
              <div class="field-grid">
                <label>
                  Metodo
                  <select id="withdraw-method" name="method">
                    <option value="manual_mock">Ambiente local</option>
                  </select>
                </label>

                <label>
                  Moeda
                  <input id="withdraw-currency" name="currency" type="text" value="USD" maxlength="3" />
                </label>

                <label>
                  Valor
                  <input id="withdraw-amount" name="amount" type="number" min="0.01" step="0.01" placeholder="50.00" />
                </label>

                <label>
                  Chave de idempotencia
                  <input id="withdraw-idempotency" name="idempotencyKey" type="text" placeholder="Opcional" />
                </label>
              </div>

              <label>
                Descricao
                <textarea id="withdraw-description" name="description" placeholder="Ex.: Retirada para conta externa"></textarea>
              </label>

              <div class="form-actions">
                <div id="withdraw-inline-status" class="summary-note">Revise saldo disponivel, valor e contexto da conta antes de confirmar.</div>
                <button id="withdraw-submit" type="submit">Solicitar saque</button>
              </div>
            </form>
          </article>

          <div class="methods">
            <article id="method-card-manual" class="method-card active">
              <div class="method-badge">Disponivel agora</div>
              <h2 style="margin-top: 12px;">Ambiente local</h2>
              <p>Executa o saque imediatamente no ambiente de desenvolvimento para testar risco, saldo disponivel e reflexo na carteira sem depender de um parceiro externo.</p>
            </article>

            <article class="instruction-card">
              <div class="eyebrow">Instrucoes</div>
              <h2 id="instruction-title" style="margin-top: 10px;">Fluxo local de retirada</h2>
              <ul id="instruction-list">
                <li>Somente o saldo disponivel pode ser retirado.</li>
                <li>Ordens abertas mantem parte do capital em reservado e esse valor nao sai da carteira.</li>
                <li>Limites simples de risco e status da conta podem bloquear a solicitacao.</li>
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
      const withdrawStatus = document.getElementById("withdraw-status");
      const withdrawInlineStatus = document.getElementById("withdraw-inline-status");
      const withdrawForm = document.getElementById("withdraw-form");
      const withdrawMethodInput = document.getElementById("withdraw-method");
      const withdrawCurrencyInput = document.getElementById("withdraw-currency");
      const withdrawAmountInput = document.getElementById("withdraw-amount");
      const withdrawIdempotencyInput = document.getElementById("withdraw-idempotency");
      const withdrawDescriptionInput = document.getElementById("withdraw-description");
      const withdrawSubmitButton = document.getElementById("withdraw-submit");
      const walletAvailable = document.getElementById("wallet-available");
      const walletReserved = document.getElementById("wallet-reserved");
      const walletTotal = document.getElementById("wallet-total");
      const walletCurrency = document.getElementById("wallet-currency");
      const withdrawLimitNote = document.getElementById("withdraw-limit-note");

      let currentAvailable = 0;
      let currentCurrency = "USD";

      const setStatus = (message, tone = "default") => {
        withdrawStatus.dataset.tone = tone;
        withdrawStatus.textContent = message;
      };

      const setInlineStatus = (message) => {
        withdrawInlineStatus.textContent = message;
      };

      const formatAmount = (value, currency) => {
        const amount = Number(value || 0);
        const normalized = Number.isFinite(amount) ? amount.toFixed(2) : String(value || "0.00");
        return currency ? normalized + " " + currency : normalized;
      };

      const paintIdentity = (user) => {
        identityName.textContent = user.name || user.email;
        identityMeta.textContent = [user.email, user.phone || "telefone em breve", user.status].join(" • ");
        withdrawLimitNote.textContent = user.status === "active" ? "Conta apta a solicitar saque" : "Conta precisa estar ativa";
      };

      const paintBalance = (balance) => {
        currentAvailable = Number(balance.available || 0);
        currentCurrency = balance.currency || "USD";
        walletAvailable.textContent = formatAmount(balance.available, balance.currency);
        walletReserved.textContent = formatAmount(balance.reserved, balance.currency);
        walletTotal.textContent = formatAmount(balance.total, balance.currency);
        walletCurrency.textContent = "Contas em " + currentCurrency;
      };

      const validateForm = () => {
        const method = withdrawMethodInput.value.trim();
        const currency = withdrawCurrencyInput.value.trim().toUpperCase();
        const amount = Number(withdrawAmountInput.value);

        if (!method) {
          return "Escolha um metodo de saque.";
        }

        if (currency.length !== 3) {
          return "Informe uma moeda com 3 letras.";
        }

        if (!Number.isFinite(amount) || amount <= 0) {
          return "Informe um valor maior que zero para o saque.";
        }

        if (currency !== currentCurrency) {
          return "O saque deve usar a mesma moeda da carteira atual.";
        }

        if (amount > currentAvailable) {
          return "O valor solicitado excede o saldo disponivel para saque.";
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
        setStatus("Carregando carteira, contexto de saque e validacoes...");

        try {
          const [user] = await Promise.all([
            sessionClient.resolveUser(),
            loadBalance(),
          ]);

          paintIdentity(user);
          setStatus("Revise saldo disponivel e confirme o saque.", "success");
          setInlineStatus("Saque sujeito a saldo, status da conta e limites configurados.");
        } catch (error) {
          if (error?.code === "unauthenticated") {
            sessionClient.redirectToLogin("expired");
            return;
          }

          setStatus(error?.message || "Nao foi possivel preparar a tela de saque.", "danger");
        }
      };

      withdrawForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const validationMessage = validateForm();

        if (validationMessage) {
          setStatus(validationMessage, "danger");
          return;
        }

        withdrawSubmitButton.disabled = true;
        setStatus("Criando saque e atualizando carteira...");
        setInlineStatus("Processando solicitacao...");

        const currency = withdrawCurrencyInput.value.trim().toUpperCase();
        const amount = Number(withdrawAmountInput.value).toFixed(2);
        const idempotencyKey = withdrawIdempotencyInput.value.trim();
        const description = withdrawDescriptionInput.value.trim();

        try {
          const response = await sessionClient.fetchWithAuth("/api/payments/withdrawals", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
            },
            body: JSON.stringify({
              amount,
              currency,
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

            throw new Error(payload?.message || "Nao foi possivel concluir o saque.");
          }

          await loadBalance();
          if (typeof syncWalletHeader === "function") {
            await syncWalletHeader();
          }

          withdrawAmountInput.value = "";
          withdrawDescriptionInput.value = "";
          setStatus("Saque concluido com sucesso. A carteira ja reflete a retirada.", "success");
          setInlineStatus("Saque " + (payload?.payment?.uuid || "processado") + " concluido.");
        } catch (error) {
          setStatus(error?.message || "Nao foi possivel concluir o saque.", "danger");
          setInlineStatus("Revise saldo, limites e status da conta.");
        } finally {
          withdrawSubmitButton.disabled = false;
        }
      });

      logoutButton.addEventListener("click", () => {
        sessionClient.logout();
      });

      loadContext();
    </script>
  </body>
</html>`;
