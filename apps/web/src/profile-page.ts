import { escapeHtml } from "./html.js";
import { renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

export const renderProfilePage = (input: {
  appName: string;
  pathname: string;
}) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Minha conta | ${escapeHtml(input.appName)}</title>
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

      .hero {
        padding: 32px;
      }

      .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
        gap: 22px;
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
        max-width: 10ch;
      }

      p {
        color: var(--muted);
        line-height: 1.7;
      }

      .identity-card {
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

      form {
        margin-top: 20px;
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

      input {
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

      @media (max-width: 900px) {
        .hero-grid,
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
            <h1>Seu perfil, sem depender do admin.</h1>
            <p>Atualize nome, email e telefone em uma tela dedicada do portal. Essa base prepara o caminho para KYC, seguranca da conta e operacao autenticada.</p>
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
        <div class="eyebrow">Perfil</div>
        <h2>Manutencao cadastral</h2>
        <p>Os dados abaixo sao os mesmos usados pelo fluxo de autenticacao e vao sustentar onboarding, notificacoes e verificacoes futuras.</p>

        <form id="profile-form">
          <div class="field-grid">
            <label>
              Nome
              <input id="profile-name" name="name" type="text" autocomplete="name" required />
            </label>

            <label>
              Email
              <input id="profile-email" name="email" type="email" autocomplete="email" required />
            </label>

            <label>
              Telefone
              <input id="profile-phone" name="phone" type="tel" autocomplete="tel" required />
            </label>
          </div>

          <div class="form-actions">
            <div id="profile-status" class="status">Carregando seu perfil...</div>
            <button id="profile-submit" type="submit">Salvar alteracoes</button>
          </div>
        </form>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}

      const sessionClient = window.ProjetoAlfaWebSession;
      const statusNode = document.getElementById("profile-status");
      const submitButton = document.getElementById("profile-submit");
      const form = document.getElementById("profile-form");
      const identityName = document.getElementById("identity-name");
      const identityMeta = document.getElementById("identity-meta");
      const logoutButton = document.getElementById("logout-button");
      const nameInput = document.getElementById("profile-name");
      const emailInput = document.getElementById("profile-email");
      const phoneInput = document.getElementById("profile-phone");

      const setStatus = (message, tone = "default") => {
        statusNode.dataset.tone = tone;
        statusNode.textContent = message;
      };

      const redirectToLogin = (reason = "expired") => {
        const url = new URL("/login", window.location.origin);
        url.searchParams.set("reason", reason);
        window.location.href = url.toString();
      };

      const paintIdentity = (user) => {
        identityName.textContent = user.name || user.email;
        identityMeta.textContent = [user.email, user.phone || "telefone em breve", user.status].join(" • ");
      };

      const loadProfile = async () => {
        try {
          const payload = await sessionClient.fetchJsonWithAuth("/api/users/me", {
            method: "GET",
          }, "Nao foi possivel carregar o perfil.");

          const user = payload.user;
          sessionClient.updateUser(user);
          paintIdentity(user);

          nameInput.value = user.name || "";
          emailInput.value = user.email || "";
          phoneInput.value = user.phone || "";

          setStatus("Perfil carregado. Atualize os dados e salve quando quiser.");
        } catch (error) {
          if (error?.code === "unauthenticated") {
            redirectToLogin("expired");
            return;
          }

          setStatus(error?.message || "Nao foi possivel carregar o perfil.", "danger");
        }
      };

      logoutButton.addEventListener("click", () => {
        sessionClient.logout("logged-out");
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        submitButton.disabled = true;
        setStatus("Salvando suas alteracoes...");

        try {
          const payload = await sessionClient.fetchJsonWithAuth("/api/users/me", {
            method: "PATCH",
            body: JSON.stringify({
              name: nameInput.value.trim(),
              email: emailInput.value.trim(),
              phone: phoneInput.value.trim(),
            }),
          }, "Nao foi possivel atualizar o perfil.");

          sessionClient.updateUser(payload.user);
          paintIdentity(payload.user);
          setStatus("Perfil atualizado com sucesso.", "success");
        } catch (error) {
          if (error?.code === "unauthenticated") {
            redirectToLogin("expired");
            return;
          }

          setStatus(error?.message || "Nao foi possivel atualizar o perfil.", "danger");
        } finally {
          submitButton.disabled = false;
        }
      });

      loadProfile();
    </script>
  </body>
</html>`;
