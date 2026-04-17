import { escapeHtml } from "./html.js";
import { renderWalletHeaderScript, renderWebChromeStyles, renderWebNavigation } from "./navigation.js";
import { renderSessionClientScript } from "./session.js";

type PortalCard = {
  title: string;
  description: string;
  href: string;
  tone?: "default" | "accent";
};

export const renderPortalPage = (input: {
  appName: string;
  pathname: string;
  eyebrow: string;
  title: string;
  description: string;
  cards: PortalCard[];
  status?: string;
  authMode?: "public" | "protected";
}) => {
  const safeTitle = escapeHtml(input.title);
  const safeDescription = escapeHtml(input.description);
  const safeEyebrow = escapeHtml(input.eyebrow);
  const statusMarkup = input.status
    ? `<div class="status-banner">${escapeHtml(input.status)}</div>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle} | ${escapeHtml(input.appName)}</title>
    <style>
      :root {
        --bg: #f5f9fc;
        --panel: rgba(255, 255, 255, 0.9);
        --ink: #0f172a;
        --muted: #475569;
        --line: rgba(15, 23, 42, 0.08);
        --accent: #0369a1;
        --accent-soft: rgba(3, 105, 161, 0.12);
        --shadow: 0 24px 64px rgba(20, 34, 56, 0.1);
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
          radial-gradient(circle at top left, rgba(125, 211, 252, 0.35), transparent 24%),
          radial-gradient(circle at top right, rgba(45, 212, 191, 0.22), transparent 22%),
          linear-gradient(180deg, #fbfdff 0%, var(--bg) 55%, #ebf4fb 100%);
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
        padding: 34px;
      }

      .eyebrow {
        color: #0369a1;
        font-size: 0.8rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      h1, h2 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        letter-spacing: -0.03em;
      }

      h1 {
        margin-top: 12px;
        max-width: 10ch;
        font-size: clamp(2.8rem, 6vw, 4.8rem);
        line-height: 0.95;
      }

      p {
        line-height: 1.7;
        color: var(--muted);
      }

      .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
        gap: 22px;
        align-items: start;
      }

      .highlight {
        padding: 20px;
        border-radius: 22px;
        border: 1px solid rgba(3, 105, 161, 0.12);
        background: linear-gradient(135deg, rgba(3, 105, 161, 0.12), rgba(15, 118, 110, 0.08));
      }

      .identity-card {
        margin-top: 18px;
        padding: 16px 18px;
        border-radius: 18px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        background: rgba(255, 255, 255, 0.72);
      }

      .identity-label {
        color: #64748b;
        font-size: 0.76rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .identity-value {
        margin-top: 6px;
        font-weight: 700;
      }

      .identity-meta {
        margin-top: 6px;
        color: var(--muted);
        font-size: 0.92rem;
      }

      .identity-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 14px;
      }

      .identity-actions button {
        border: 0;
        border-radius: 999px;
        padding: 10px 14px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        color: #0f172a;
        background: rgba(15, 23, 42, 0.06);
      }

      .highlight strong {
        display: block;
        font-size: 1rem;
      }

      .highlight ul {
        margin: 14px 0 0;
        padding-left: 18px;
        color: var(--muted);
      }

      .status-banner {
        margin-top: 18px;
        padding: 14px 16px;
        border-radius: 18px;
        background: var(--accent-soft);
        color: var(--accent);
        font-weight: 600;
      }

      .panel {
        margin-top: 22px;
        padding: 24px;
      }

      .card-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .card {
        padding: 20px;
        border-radius: 22px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.7);
      }

      .card[data-tone="accent"] {
        background: linear-gradient(135deg, rgba(3, 105, 161, 0.12), rgba(15, 118, 110, 0.08));
        border-color: rgba(3, 105, 161, 0.18);
      }

      .card a {
        color: var(--accent);
        font-weight: 700;
        text-decoration: none;
      }

      @media (max-width: 980px) {
        .hero-grid,
        .card-grid {
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
            <div class="eyebrow">${safeEyebrow}</div>
            <h1>${safeTitle}</h1>
            <p>${safeDescription}</p>
            ${statusMarkup}
          </div>
          <aside class="highlight">
            <strong>Fundacao do portal</strong>
            <p>Este app organiza a experiencia do usuario comum em trilhas separadas para cadastro, mercados, ordens e portfolio.</p>
            <ul>
              <li>Onboarding com cadastro e login.</li>
              <li>Mercados acessiveis sem poluir o admin.</li>
              <li>Area autenticada para ordens e portfolio.</li>
            </ul>
            ${input.authMode === "protected"
              ? `
                <div class="identity-card">
                  <div class="identity-label">Sessao</div>
                  <div id="identity-name" class="identity-value">Validando sessao...</div>
                  <div id="identity-meta" class="identity-meta">Esta area exige autenticacao do usuario comum.</div>
                  <div class="identity-actions">
                    <button id="logout-button" type="button">Sair</button>
                  </div>
                </div>
              `
              : ""}
          </aside>
        </div>
      </section>

      <section class="panel">
        <div class="card-grid">
          ${input.cards
            .map(
              (card) => `
                <article class="card" data-tone="${card.tone ?? "default"}">
                  <h2>${escapeHtml(card.title)}</h2>
                  <p>${escapeHtml(card.description)}</p>
                  <a href="${card.href}">Abrir area</a>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>

      <script>
        ${renderSessionClientScript()}
        ${renderWalletHeaderScript()}

        ${input.authMode === "protected"
          ? `
            const sessionClient = window.ProjetoAlfaWebSession;
            const identityName = document.getElementById("identity-name");
            const identityMeta = document.getElementById("identity-meta");
            const logoutButton = document.getElementById("logout-button");

            if (logoutButton) {
              logoutButton.addEventListener("click", () => {
                sessionClient.logout("logged-out");
              });
            }

            sessionClient.resolveUser()
              .then((user) => {
                if (identityName) {
                  identityName.textContent = user.name || user.email;
                }
                if (identityMeta) {
                  identityMeta.textContent = [user.email, user.phone || "telefone em breve", user.status].join(" • ");
                }
              })
              .catch(() => {
                sessionClient.redirectToLogin("protected");
              });
          `
          : ""}
      </script>
    </main>
  </body>
</html>`;
};
