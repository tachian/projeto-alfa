import { escapeHtml } from "./html.js";
import { renderSessionClientScript } from "./session.js";

export const renderLoginPage = (input: {
  appName: string;
}) => {
  const title = `Login | ${input.appName}`;
  const safeAppName = escapeHtml(input.appName);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        --bg: #f5efe4;
        --card: rgba(255, 250, 243, 0.94);
        --ink: #1b1510;
        --muted: #6d5f4f;
        --line: rgba(50, 34, 19, 0.12);
        --accent: #a34a2c;
        --accent-strong: #7e341b;
        --danger: #8c2f1c;
        --success: #276749;
        --shadow: 0 28px 70px rgba(53, 34, 20, 0.16);
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
          radial-gradient(circle at top left, rgba(240, 197, 162, 0.58), transparent 28%),
          radial-gradient(circle at bottom right, rgba(192, 112, 73, 0.26), transparent 24%),
          linear-gradient(180deg, #fbf7f0 0%, #f2e6d6 100%);
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .shell {
        width: min(100%, 1080px);
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(340px, 420px);
        border-radius: 28px;
        overflow: hidden;
        box-shadow: var(--shadow);
        border: 1px solid rgba(98, 60, 28, 0.12);
        background: rgba(255, 252, 247, 0.9);
      }

      .hero {
        padding: 44px;
        background:
          linear-gradient(145deg, rgba(255, 249, 241, 0.98), rgba(239, 223, 204, 0.84)),
          var(--card);
      }

      .eyebrow {
        font-size: 0.78rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--muted);
      }

      h1, h2 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        letter-spacing: -0.03em;
      }

      h1 {
        margin-top: 16px;
        font-size: clamp(2.6rem, 4vw, 4.4rem);
        line-height: 0.95;
        max-width: 9ch;
      }

      .copy {
        margin-top: 20px;
        max-width: 54ch;
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
        background: rgba(255, 255, 255, 0.62);
        border: 1px solid rgba(76, 51, 24, 0.08);
      }

      .hero-list strong {
        display: block;
        margin-bottom: 4px;
      }

      .panel {
        padding: 36px 30px;
        background: rgba(255, 253, 249, 0.95);
      }

      .panel h2 {
        font-size: 1.8rem;
      }

      .panel-copy {
        margin: 12px 0 0;
        color: var(--muted);
        line-height: 1.7;
      }

      form {
        margin-top: 28px;
        display: grid;
        gap: 16px;
      }

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
        background: rgba(255, 255, 255, 0.88);
      }

      input:focus {
        outline: 2px solid rgba(163, 74, 44, 0.16);
        border-color: rgba(163, 74, 44, 0.32);
      }

      button {
        border: 0;
        border-radius: 999px;
        padding: 14px 18px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        color: #fff9f3;
        background: linear-gradient(135deg, var(--accent), var(--accent-strong));
      }

      button:disabled {
        opacity: 0.65;
        cursor: wait;
      }

      .status {
        min-height: 24px;
        margin-top: 18px;
        color: var(--muted);
      }

      .status[data-tone="danger"] {
        color: var(--danger);
      }

      .status[data-tone="success"] {
        color: var(--success);
      }

      .footer-link {
        display: inline-block;
        margin-top: 16px;
        color: var(--accent);
        text-decoration: none;
      }

      @media (max-width: 900px) {
        .shell {
          grid-template-columns: 1fr;
        }

        .hero,
        .panel {
          padding: 28px;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div class="eyebrow">Admin Access</div>
        <h1>${safeAppName}</h1>
        <p class="copy">
          Entre com sua conta operacional para acessar o painel administrativo, acompanhar mercados e executar
          as acoes de resolucao e liquidacao da plataforma.
        </p>
        <ul class="hero-list">
          <li>
            <strong>Autenticacao real</strong>
            O admin reaproveita diretamente os endpoints POST /auth/login, GET /auth/me e POST /auth/refresh da API.
          </li>
          <li>
            <strong>Sessao no navegador</strong>
            O frontend salva a sessao local para reutilizar o acesso nas proximas telas.
          </li>
          <li>
            <strong>Acesso controlado</strong>
            Somente usuarios com permissao administrativa conseguem operar o painel.
          </li>
        </ul>
      </section>

      <section class="panel">
        <div class="eyebrow">Login</div>
        <h2>Entrar no admin</h2>
        <p class="panel-copy">Use o mesmo email e senha cadastrados na API.</p>

        <form id="login-form">
          <label>
            Email
            <input id="email" name="email" type="email" autocomplete="email" placeholder="user@example.com" required />
          </label>

          <label>
            Senha
            <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Sua senha" required />
          </label>

          <button id="submit-button" type="submit">Entrar</button>
        </form>

        <div id="login-status" class="status">Informe suas credenciais para iniciar a sessao administrativa.</div>
        <a class="footer-link" href="/">Voltar para o painel</a>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}

      const form = document.getElementById("login-form");
      const statusNode = document.getElementById("login-status");
      const submitButton = document.getElementById("submit-button");

      const setStatus = (message, tone = "default") => {
        statusNode.textContent = message;
        statusNode.dataset.tone = tone;
      };

      const setSubmitting = (isSubmitting) => {
        submitButton.disabled = isSubmitting;
        submitButton.textContent = isSubmitting ? "Entrando..." : "Entrar";
      };

      const resolveLoginErrorMessage = (input) => {
        if (input.status === 401) {
          return "Email ou senha invalidos. Revise as credenciais e tente novamente.";
        }

        if (input.status === 502) {
          return "A API de autenticacao nao esta disponivel no momento. Verifique se o api esta rodando em localhost:4000.";
        }

        if (input.networkError) {
          return "Nao foi possivel conectar ao admin. Recarregue a pagina e tente novamente.";
        }

        return input.message || "Nao foi possivel autenticar no admin.";
      };

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setStatus("Validando credenciais...");

        const formData = new FormData(form);
        const payload = {
          email: String(formData.get("email") ?? "").trim(),
          password: String(formData.get("password") ?? ""),
        };

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const responseText = await response.text();
          const data = responseText ? JSON.parse(responseText) : null;

          if (!response.ok) {
            throw new Error(resolveLoginErrorMessage({
              status: response.status,
              message: data?.message,
            }));
          }

          window.ProjetoAlfaSession.save(data);

          setStatus("Login realizado com sucesso. Redirecionando...", "success");
          window.location.href = "/";
        } catch (error) {
          const isNetworkError =
            error instanceof TypeError ||
            (error instanceof Error && error.message === "Failed to fetch");

          const message = isNetworkError
            ? resolveLoginErrorMessage({ networkError: true })
            : error instanceof Error
              ? error.message
              : "Falha ao autenticar.";

          setStatus(message, "danger");
        } finally {
          setSubmitting(false);
        }
      });
    </script>
  </body>
</html>`;
};
