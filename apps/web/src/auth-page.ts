import { escapeHtml } from "./html.js";
import { renderSessionClientScript } from "./session.js";

export const renderAuthPage = (input: {
  appName: string;
  mode: "login" | "register";
}) => {
  const isRegister = input.mode === "register";
  const title = isRegister ? `Criar conta | ${input.appName}` : `Entrar | ${input.appName}`;
  const submitLabel = isRegister ? "Criar conta" : "Entrar";
  const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
  const redirectOnSuccess = isRegister ? "/markets" : "/portfolio";
  const statusMessage = isRegister
    ? "Preencha seus dados basicos para criar a conta e iniciar a sessao."
    : "Use seu email e senha para entrar no portal.";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        --bg: #f5f9fc;
        --card: rgba(255, 255, 255, 0.94);
        --ink: #0f172a;
        --muted: #475569;
        --line: rgba(15, 23, 42, 0.12);
        --accent: #0369a1;
        --accent-strong: #0f766e;
        --danger: #b42318;
        --success: #166534;
        --shadow: 0 28px 70px rgba(20, 34, 56, 0.16);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(125, 211, 252, 0.34), transparent 28%),
          radial-gradient(circle at bottom right, rgba(45, 212, 191, 0.22), transparent 24%),
          linear-gradient(180deg, #fbfdff 0%, #eaf3fa 100%);
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .shell {
        width: min(100%, 1100px);
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 440px);
        border-radius: 30px;
        overflow: hidden;
        box-shadow: var(--shadow);
        border: 1px solid rgba(15, 23, 42, 0.08);
        background: rgba(255, 255, 255, 0.9);
      }

      .hero {
        padding: 44px;
        background:
          linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.88)),
          var(--card);
      }

      .eyebrow {
        font-size: 0.78rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #0369a1;
      }

      h1, h2 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        letter-spacing: -0.03em;
      }

      h1 {
        margin-top: 16px;
        font-size: clamp(2.8rem, 4vw, 4.6rem);
        line-height: 0.95;
        max-width: 9ch;
      }

      .copy {
        margin-top: 20px;
        max-width: 56ch;
        color: var(--muted);
        line-height: 1.8;
      }

      .hero-list {
        margin: 28px 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 14px;
      }

      .hero-list li {
        padding: 14px 16px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(15, 23, 42, 0.08);
      }

      .hero-list strong { display: block; margin-bottom: 4px; }

      .panel {
        padding: 36px 30px;
        background: rgba(252, 255, 255, 0.95);
      }

      .panel h2 { font-size: 1.8rem; }
      .panel-copy { margin: 12px 0 0; color: var(--muted); line-height: 1.7; }
      form { margin-top: 28px; display: grid; gap: 16px; }
      .field-grid { display: grid; gap: 16px; }

      label {
        display: grid;
        gap: 8px;
        font-size: 0.95rem;
        color: var(--muted);
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

      input:focus {
        outline: 2px solid rgba(3, 105, 161, 0.16);
        border-color: rgba(3, 105, 161, 0.28);
      }

      button {
        border: 0;
        border-radius: 999px;
        padding: 14px 18px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        color: white;
        background: linear-gradient(135deg, var(--accent), var(--accent-strong));
      }

      .status {
        min-height: 24px;
        margin-top: 18px;
        color: var(--muted);
      }

      .status[data-tone="danger"] { color: var(--danger); }
      .status[data-tone="success"] { color: var(--success); }

      .footer-link {
        display: inline-block;
        margin-top: 16px;
        color: var(--accent);
        text-decoration: none;
      }

      @media (max-width: 900px) {
        .shell { grid-template-columns: 1fr; }
        .hero, .panel { padding: 28px; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div class="eyebrow">Portal</div>
        <h1>${isRegister ? "Comece a operar em poucos passos." : "Entre e continue sua jornada nos mercados."}</h1>
        <p class="copy">
          ${isRegister
            ? "O portal do usuario vai comecar com onboarding enxuto: nome, email, telefone e senha, reaproveitando a infraestrutura de autenticacao do projeto."
            : "O login reutiliza diretamente POST /auth/login, GET /auth/me e POST /auth/refresh da API para manter a sessao do usuario consistente."}
        </p>
        <ul class="hero-list">
          <li>
            <strong>Onboarding direto</strong>
            ${isRegister ? "Criacao de conta com informacoes basicas e inicio imediato da sessao." : "Acesso com email e senha ja cadastrados no projeto."}
          </li>
          <li>
            <strong>Sessao no navegador</strong>
            O portal salva a sessao local para reutilizar o acesso nas rotas autenticadas.
          </li>
          <li>
            <strong>Base pronta para portfolio e ordens</strong>
            O mesmo estado de sessao vai sustentar mercados, ordens e portfolio nas proximas etapas.
          </li>
        </ul>
      </section>

      <section class="panel">
        <div class="eyebrow">${isRegister ? "Cadastro" : "Login"}</div>
        <h2>${isRegister ? "Criar conta" : "Entrar no portal"}</h2>
        <p class="panel-copy">${statusMessage}</p>

        <form id="auth-form">
          <div class="field-grid">
            ${isRegister ? `
              <label>
                Nome
                <input id="name" name="name" type="text" autocomplete="name" placeholder="Seu nome completo" required />
              </label>
            ` : ""}

            <label>
              Email
              <input id="email" name="email" type="email" autocomplete="email" placeholder="user@example.com" required />
            </label>

            ${isRegister ? `
              <label>
                Telefone
                <input id="phone" name="phone" type="tel" autocomplete="tel" placeholder="+55 85 99999-9999" required />
              </label>
            ` : ""}

            <label>
              Senha
              <input id="password" name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" placeholder="Sua senha" required />
            </label>
          </div>

          <button id="submit-button" type="submit">${submitLabel}</button>
        </form>

        <div id="auth-status" class="status">${escapeHtml(statusMessage)}</div>
        <a class="footer-link" href="${isRegister ? "/login" : "/register"}">${isRegister ? "Ja tenho conta" : "Criar uma conta"}</a>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}

      const form = document.getElementById("auth-form");
      const statusNode = document.getElementById("auth-status");
      const submitButton = document.getElementById("submit-button");
      const currentUrl = new URL(window.location.href);
      const reason = currentUrl.searchParams.get("reason");
      const returnTo = currentUrl.searchParams.get("returnTo");

      const setStatus = (message, tone = "default") => {
        statusNode.dataset.tone = tone;
        statusNode.textContent = message;
      };

      const resolveRedirectTarget = () => {
        if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
          return returnTo;
        }

        return ${JSON.stringify(redirectOnSuccess)};
      };

      const isValidEmail = (value) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
      const normalizePhone = (value) => value.replace(/\\D/g, "");

      const validatePayload = (payload) => {
        if (${isRegister ? "true" : "false"}) {
          if (!payload.name || payload.name.length < 3) {
            return "Informe um nome com pelo menos 3 caracteres.";
          }

          if (!payload.phone || normalizePhone(payload.phone).length < 10) {
            return "Informe um telefone valido com DDD.";
          }

          if (!payload.password || payload.password.length < 8) {
            return "A senha deve ter pelo menos 8 caracteres.";
          }
        } else if (!payload.password) {
          return "Informe sua senha para continuar.";
        }

        if (!payload.email || !isValidEmail(payload.email)) {
          return "Informe um email valido para continuar.";
        }

        return "";
      };

      if (reason === "expired") {
        setStatus("Sua sessao expirou. Entre novamente para continuar.", "danger");
      } else if (reason === "protected") {
        setStatus("Faca login para acessar a area solicitada do portal.", "danger");
      } else if (reason === "logged-out") {
        setStatus("Sessao encerrada com sucesso.", "success");
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        submitButton.disabled = true;
        setStatus(${JSON.stringify(isRegister ? "Criando sua conta..." : "Validando suas credenciais...")});

        const payload = {
          ${isRegister ? 'name: document.getElementById("name").value.trim(),' : ""}
          email: document.getElementById("email").value.trim(),
          ${isRegister ? 'phone: document.getElementById("phone").value.trim(),' : ""}
          password: document.getElementById("password").value,
        };

        const validationMessage = validatePayload(payload);

        if (validationMessage) {
          submitButton.disabled = false;
          setStatus(validationMessage, "danger");
          return;
        }

        try {
          const response = await fetch(${JSON.stringify(endpoint)}, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const payloadText = await response.text();
          const result = payloadText ? JSON.parse(payloadText) : null;

          if (!response.ok) {
            if (response.status === 401) {
              setStatus("Email ou senha invalidos. Revise as credenciais e tente novamente.", "danger");
            } else if (response.status === 409) {
              setStatus(result?.message ?? "Ja existe uma conta com esse email.", "danger");
            } else if (response.status === 502) {
              setStatus("A API de autenticacao nao esta disponivel no momento. Tente novamente em instantes.", "danger");
            } else {
              setStatus(result?.message ?? "Nao foi possivel concluir a autenticacao.", "danger");
            }

            return;
          }

          window.ProjetoAlfaWebSession.save(result);
          setStatus(${JSON.stringify(isRegister ? "Conta criada com sucesso. Redirecionando..." : "Sessao iniciada. Redirecionando...")}, "success");

          window.setTimeout(() => {
            window.location.href = resolveRedirectTarget();
          }, 250);
        } catch {
          setStatus("Nao foi possivel conectar ao portal neste momento. Verifique se o web esta ativo e tente novamente.", "danger");
        } finally {
          submitButton.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
};
