import { escapeHtml } from "./html.js";
import { renderWalletHeaderScript, renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderVerificationPage = (input: {
  appName: string;
  pathname: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Verificacao | ${escapeHtml(input.appName)}</title>
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
        width: min(1520px, calc(100% - 32px));
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
      .field-grid {
        display: grid;
        gap: 22px;
      }

      .hero-grid {
        grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
      }

      .content-grid {
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
      }

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
        font-size: clamp(2.6rem, 6vw, 4.4rem);
        line-height: 0.95;
        max-width: 12ch;
      }

      p, li {
        color: var(--muted);
        line-height: 1.7;
      }

      .identity-card,
      .status-card,
      .requirements-card {
        padding: 18px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.76);
      }

      .identity-label {
        color: #64748b;
        font-size: 0.76rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .identity-value {
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

      .panel {
        margin-top: 22px;
        padding: 28px;
      }

      .status-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 8px 14px;
        font-weight: 700;
        background: rgba(3, 105, 161, 0.08);
        color: var(--accent);
      }

      .status-chip[data-status="approved"] {
        background: rgba(22, 101, 52, 0.1);
        color: var(--success);
      }

      .status-chip[data-status="rejected"] {
        background: rgba(180, 35, 24, 0.08);
        color: var(--danger);
      }

      .status-chip[data-status="manual_review"],
      .status-chip[data-status="pending"] {
        background: rgba(138, 91, 23, 0.12);
        color: var(--warning);
      }

      .requirements-list {
        margin: 14px 0 0;
        padding-left: 18px;
      }

      form {
        margin-top: 20px;
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

      .form-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .form-actions button {
        color: white;
        background: linear-gradient(135deg, var(--accent), #0f766e);
      }

      .status {
        min-height: 24px;
        color: var(--muted);
      }

      .status[data-tone="success"] { color: var(--success); }
      .status[data-tone="danger"] { color: var(--danger); }

      .helper-links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      .helper-link {
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
            <div class="eyebrow">Minha conta</div>
            <h1>Conclua sua verificacao para negociar.</h1>
            <p>Esta trilha envia os dados basicos de KYC do usuario e mostra o status atual da analise. Quando a verificacao for aprovada, a conta passa a operar como <strong>active</strong>.</p>
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
        <div class="content-grid">
          <div>
            <div class="eyebrow">Status atual</div>
            <h2>Situação da verificacao</h2>
            <div class="status-card">
              <div id="verification-chip" class="status-chip" data-status="required">required</div>
              <p id="verification-summary" style="margin-top: 14px;">Carregando situacao atual...</p>
            </div>

            <div class="requirements-card" style="margin-top: 18px;">
              <div class="eyebrow">Requisitos</div>
              <h2 style="font-size: 1.4rem; margin-top: 10px;">O que falta para ativar a conta</h2>
              <ul id="requirements-list" class="requirements-list">
                <li>Carregando requisitos...</li>
              </ul>
            </div>

            <div class="helper-links">
              <a class="helper-link" href="/account/profile">Voltar ao perfil</a>
              <a class="helper-link" href="/markets">Explorar mercados</a>
            </div>
          </div>

          <div>
            <div class="eyebrow">Formulario</div>
            <h2>Enviar verificacao</h2>
            <p>Para o ambiente atual, o fluxo mock usa nome completo, documento, pais e data de nascimento para decidir o resultado de verificacao.</p>

            <form id="verification-form">
              <div class="field-grid">
                <label>
                  Nome completo
                  <input id="full-name" name="fullName" type="text" autocomplete="name" required />
                </label>

                <label>
                  Tipo de documento
                  <select id="document-type" name="documentType">
                    <option value="cpf">CPF</option>
                    <option value="passport">Passport</option>
                    <option value="rg">RG</option>
                  </select>
                </label>

                <label>
                  Numero do documento
                  <input id="document-number" name="documentNumber" type="text" required />
                </label>

                <label>
                  Pais
                  <input id="country-code" name="countryCode" type="text" value="BR" maxlength="2" required />
                </label>

                <label>
                  Data de nascimento
                  <input id="birth-date" name="birthDate" type="date" />
                </label>
              </div>

              <div class="form-actions">
                <div id="verification-status" class="status">Carregando requisitos antes de liberar o envio...</div>
                <button id="verification-submit" type="submit">Enviar verificacao</button>
              </div>
            </form>
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
      const verificationChip = document.getElementById("verification-chip");
      const verificationSummary = document.getElementById("verification-summary");
      const requirementsList = document.getElementById("requirements-list");
      const form = document.getElementById("verification-form");
      const submitButton = document.getElementById("verification-submit");
      const statusNode = document.getElementById("verification-status");
      const fullNameInput = document.getElementById("full-name");
      const documentTypeInput = document.getElementById("document-type");
      const documentNumberInput = document.getElementById("document-number");
      const countryCodeInput = document.getElementById("country-code");
      const birthDateInput = document.getElementById("birth-date");

      const setStatus = (message, tone = "default") => {
        statusNode.dataset.tone = tone;
        statusNode.textContent = message;
      };

      const paintIdentity = (user) => {
        identityName.textContent = user.name || user.email;
        identityMeta.textContent = [user.email, user.phone || "telefone em breve", user.status].join(" • ");
        if (!fullNameInput.value && user.name) {
          fullNameInput.value = user.name;
        }
      };

      const renderRequirements = (requirements) => {
        if (!requirements.length) {
          requirementsList.innerHTML = "<li>Nenhum requisito pendente. A conta esta pronta para operar.</li>";
          return;
        }

        requirementsList.innerHTML = requirements
          .map((requirement) => "<li>" + requirement + "</li>")
          .join("");
      };

      const paintVerification = (verification) => {
        const status = verification?.status || "required";
        verificationChip.dataset.status = status;
        verificationChip.textContent = status;

        if (!verification) {
          verificationSummary.textContent = "Ainda nao recebemos uma submissao de verificacao para esta conta.";
          return;
        }

        const reviewedAt = verification.reviewedAt
          ? new Date(verification.reviewedAt).toLocaleString("pt-BR")
          : "ainda nao revisado";

        verificationSummary.textContent =
          "Status AML: " + verification.amlStatus +
          " • Risco: " + verification.riskLevel +
          " • Revisado em: " + reviewedAt + ".";
      };

      const validateForm = () => {
        const fullName = fullNameInput.value.trim();
        const documentNumber = documentNumberInput.value.trim();
        const countryCode = countryCodeInput.value.trim();

        if (fullName.length < 3) {
          return "Informe o nome completo com pelo menos 3 caracteres.";
        }

        if (documentNumber.length < 4) {
          return "Informe um documento valido com pelo menos 4 caracteres.";
        }

        if (countryCode.length !== 2) {
          return "Informe o pais no padrao ISO de 2 letras.";
        }

        return "";
      };

      const loadVerificationState = async () => {
        setStatus("Carregando status e requisitos da verificacao...");

        try {
          const [latestPayload, requirementsPayload] = await Promise.all([
            sessionClient.fetchJsonWithAuth("/api/kyc/submissions/latest", { method: "GET" }, "Nao foi possivel carregar a ultima verificacao."),
            sessionClient.fetchJsonWithAuth("/api/kyc/requirements", { method: "GET" }, "Nao foi possivel carregar os requisitos de verificacao."),
          ]);

          paintVerification(latestPayload?.verification || null);
          renderRequirements(Array.isArray(requirementsPayload?.requirements) ? requirementsPayload.requirements : []);

          const requirementStatus = requirementsPayload?.status || latestPayload?.verification?.status || "required";
          if (requirementStatus === "approved") {
            setStatus("Conta verificada. Voce ja pode operar normalmente.", "success");
          } else if (requirementStatus === "manual_review") {
            setStatus("Sua verificacao esta em revisao manual. Aguarde a conclusao da analise.");
          } else if (requirementStatus === "rejected") {
            setStatus("A verificacao foi rejeitada. Revise os requisitos e envie novamente.", "danger");
          } else if (latestPayload?.verification) {
            setStatus("Verificacao enviada. Aguardando analise.");
          } else {
            setStatus("Envie sua verificacao para ativar a conta de trading.");
          }
        } catch (error) {
          if (error?.code === "unauthenticated") {
            sessionClient.redirectToLogin("protected");
            return;
          }

          paintVerification(null);
          renderRequirements([]);
          setStatus(error?.message || "Nao foi possivel carregar a situacao da verificacao.", "danger");
        }
      };

      logoutButton.addEventListener("click", () => {
        sessionClient.logout("logged-out");
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        submitButton.disabled = true;
        setStatus("Enviando sua verificacao...");

        const validationMessage = validateForm();
        if (validationMessage) {
          submitButton.disabled = false;
          setStatus(validationMessage, "danger");
          return;
        }

        try {
          await sessionClient.fetchJsonWithAuth("/api/kyc/submissions", {
            method: "POST",
            body: JSON.stringify({
              fullName: fullNameInput.value.trim(),
              documentType: documentTypeInput.value,
              documentNumber: documentNumberInput.value.trim(),
              countryCode: countryCodeInput.value.trim().toUpperCase(),
              birthDate: birthDateInput.value || undefined,
            }),
          }, "Nao foi possivel enviar a verificacao.");

          setStatus("Verificacao enviada com sucesso. Atualizando status...", "success");
          await loadVerificationState();
        } catch (error) {
          if (error?.code === "unauthenticated") {
            sessionClient.redirectToLogin("expired");
            return;
          }

          setStatus(error?.message || "Nao foi possivel enviar a verificacao.", "danger");
        } finally {
          submitButton.disabled = false;
        }
      });

      sessionClient.resolveUser()
        .then((user) => {
          paintIdentity(user);
          return loadVerificationState();
        })
        .catch(() => {
          sessionClient.redirectToLogin("protected");
        });
    </script>
  </body>
</html>`;
