import { escapeHtml } from "./html.js";
import { renderAdminChromeStyles, renderAdminNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

type WorkspaceCard = {
  title: string;
  description: string;
  href: string;
  tone?: "default" | "accent";
};

export const renderWorkspacePage = (input: {
  appName: string;
  pathname: string;
  eyebrow: string;
  title: string;
  description: string;
  cards: WorkspaceCard[];
}) => {
  const safeTitle = escapeHtml(input.title);
  const safeDescription = escapeHtml(input.description);
  const safeEyebrow = escapeHtml(input.eyebrow);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle} | ${escapeHtml(input.appName)}</title>
    <style>
      :root {
        --bg: #f4efe6;
        --panel: rgba(255, 251, 245, 0.9);
        --ink: #1b1510;
        --muted: #6d5f4f;
        --line: rgba(50, 34, 19, 0.14);
        --accent: #b14d2d;
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
        padding: 24px 0 64px;
      }

      ${renderAdminChromeStyles()}

      .hero,
      .panel {
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
        font-size: clamp(2.4rem, 5vw, 4rem);
        line-height: 0.95;
        max-width: 11ch;
      }

      p {
        color: var(--muted);
        line-height: 1.7;
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

      button {
        border: 0;
        cursor: pointer;
        padding: 11px 16px;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 600;
      }

      button.secondary {
        background: rgba(27, 21, 16, 0.08);
        color: var(--ink);
      }

      .workspace-status,
      .access-denied {
        margin-top: 18px;
        padding: 16px 18px;
        border-radius: 18px;
      }

      .workspace-status {
        background: rgba(177, 77, 45, 0.1);
        color: var(--accent);
      }

      .workspace-status[data-tone="success"] {
        background: rgba(39, 103, 73, 0.12);
        color: #276749;
      }

      .workspace-status[data-tone="danger"] {
        background: rgba(155, 44, 44, 0.12);
        color: var(--danger);
      }

      .access-denied {
        border: 1px solid rgba(155, 44, 44, 0.14);
        background: rgba(155, 44, 44, 0.08);
        color: var(--danger);
      }

      .access-denied-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 22px;
      }

      .panel {
        padding: 24px;
      }

      .workspace-card {
        border: 1px solid var(--line);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.62);
        padding: 20px;
      }

      .workspace-card[data-tone="accent"] {
        background: rgba(177, 77, 45, 0.08);
        border-color: rgba(177, 77, 45, 0.2);
      }

      .workspace-link {
        display: inline-block;
        margin-top: 14px;
        color: var(--accent);
        text-decoration: none;
        font-weight: 700;
      }

      @media (max-width: 980px) {
        .hero-top,
        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      ${renderAdminNavigation({ appName: input.appName, pathname: input.pathname })}

      <section class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">${safeEyebrow}</div>
            <h1>${safeTitle}</h1>
            <p>${safeDescription}</p>
          </div>
          <aside class="identity-card">
            <div class="identity-label">Sessao</div>
            <div id="identity-email" class="identity-value">Nao autenticado</div>
            <div id="identity-meta" class="identity-meta">Esta area valida a sessao ao carregar.</div>
            <div class="identity-actions">
              <button id="logout-button" type="button" class="secondary">Sair</button>
            </div>
          </aside>
        </div>
      </section>

      <section id="access-denied" class="access-denied" hidden>
        <div class="eyebrow">Acesso</div>
        <h2>Acesso restrito</h2>
        <p>Esta conta esta autenticada, mas nao possui a role administrativa necessaria para acessar esta area.</p>
        <div class="access-denied-actions">
          <button id="denied-switch-account" type="button" class="secondary">Trocar conta</button>
          <button id="denied-logout" type="button">Sair do painel</button>
        </div>
      </section>

      <section id="workspace-content">
        <div id="workspace-status" class="workspace-status">Validando sessao do admin...</div>
        <div class="grid">
          ${input.cards.map((card) => `
            <article class="panel workspace-card"${card.tone === "accent" ? ' data-tone="accent"' : ""}>
              <div class="eyebrow">Workspace</div>
              <h2>${escapeHtml(card.title)}</h2>
              <p>${escapeHtml(card.description)}</p>
              <a class="workspace-link" href="${card.href}">Abrir area</a>
            </article>
          `).join("")}
        </div>
      </section>
    </main>

    <script>
      ${renderSessionClientScript()}

      const setWorkspaceStatus = (message, tone = "default") => {
        const node = document.getElementById("workspace-status");
        node.textContent = message;
        node.dataset.tone = tone;
      };

      const setIdentity = (input) => {
        document.getElementById("identity-email").textContent = input.email;
        document.getElementById("identity-meta").textContent = input.meta;
      };

      const redirectToLogin = (reason = "") => {
        const targetUrl = window.ProjetoAlfaSession.buildLoginRedirectUrl(reason);
        window.location.href = targetUrl;
      };

      const logout = () => {
        window.ProjetoAlfaSession.logout("logged-out");
      };

      const switchAccount = () => {
        window.ProjetoAlfaSession.logout("switch-account");
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

      const showAccessDenied = (user) => {
        document.getElementById("workspace-content").hidden = true;
        document.getElementById("access-denied").hidden = false;
        setIdentity({
          email: user.email,
          meta: "Role: " + user.role + " | Status: " + user.status,
        });
      };

      const bootstrapSession = async () => {
        const accessToken = window.ProjetoAlfaSession.getAccessToken();

        if (!accessToken) {
          redirectToLogin();
          return;
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
              return;
            }

            throw error;
          }

          window.ProjetoAlfaSession.updateUser(payload.user);
          setIdentity({
            email: payload.user.email,
            meta: "Role: " + payload.user.role + " | Status: " + payload.user.status,
          });
          setWorkspaceStatus("Sessao validada. Navegue pela area desejada.", "success");
        } catch (error) {
          window.ProjetoAlfaSession.clear();
          const reason = error?.code === "unauthenticated" ? "expired" : "";
          redirectToLogin(reason);
        }
      };

      document.getElementById("logout-button").addEventListener("click", logout);
      document.getElementById("denied-logout").addEventListener("click", logout);
      document.getElementById("denied-switch-account").addEventListener("click", switchAccount);

      bootstrapSession();
    </script>
  </body>
</html>`;
};
