import { escapeHtml } from "./html.js";

export type WebNavSection =
  | "home"
  | "markets"
  | "wallet"
  | "payments"
  | "orders"
  | "portfolio"
  | "account"
  | "login"
  | "register";

type NavItem = {
  href: string;
  label: string;
  section: WebNavSection;
};

const PUBLIC_ITEMS: NavItem[] = [
  { href: "/", label: "Home", section: "home" },
  { href: "/markets", label: "Mercados", section: "markets" },
];

const ACCESS_ITEMS: NavItem[] = [
  { href: "/wallet", label: "Carteira", section: "wallet" },
  { href: "/payments", label: "Movimentacoes", section: "payments" },
  { href: "/orders", label: "Ordens", section: "orders" },
  { href: "/portfolio", label: "Portfolio", section: "portfolio" },
  { href: "/account/profile", label: "Minha conta", section: "account" },
];

const AUTH_ITEMS: NavItem[] = [
  { href: "/login", label: "Entrar", section: "login" },
  { href: "/register", label: "Criar conta", section: "register" },
];

const renderLinks = (items: NavItem[], activeSection: WebNavSection) =>
  items
    .map((item) => {
      const current = item.section === activeSection ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${current}>${item.label}</a>`;
    })
    .join("");

export const resolveWebNavSection = (pathname: string): WebNavSection => {
  if (pathname === "/") {
    return "home";
  }

  if (pathname.startsWith("/markets")) {
    return "markets";
  }

  if (pathname.startsWith("/orders")) {
    return "orders";
  }

  if (pathname.startsWith("/wallet")) {
    return "wallet";
  }

  if (pathname.startsWith("/payments")) {
    return "payments";
  }

  if (pathname.startsWith("/portfolio")) {
    return "portfolio";
  }

  if (pathname.startsWith("/account")) {
    return "account";
  }

  if (pathname.startsWith("/register")) {
    return "register";
  }

  return "login";
};

export const renderWebChromeStyles = () => `
  .topbar {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(240px, 0.85fr) auto;
    gap: 18px;
    align-items: center;
    margin-bottom: 24px;
    padding: 18px 20px;
    border-radius: 24px;
    border: 1px solid rgba(17, 24, 39, 0.08);
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(239, 246, 255, 0.88)),
      rgba(255, 255, 255, 0.9);
    box-shadow: 0 24px 64px rgba(20, 34, 56, 0.1);
  }

  .topbar-brand strong {
    display: block;
    color: #0f172a;
    font-size: 1rem;
  }

  .topbar-brand span {
    display: block;
    margin-top: 4px;
    color: #475569;
    font-size: 0.88rem;
  }

  .nav-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .nav-group-label {
    width: 100%;
    color: #64748b;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .nav-group a {
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: rgba(255, 255, 255, 0.72);
    color: #475569;
    text-decoration: none;
    font-weight: 600;
  }

  .nav-group a[aria-current="page"] {
    background: rgba(3, 105, 161, 0.12);
    border-color: rgba(3, 105, 161, 0.2);
    color: #0369a1;
  }

  .nav-cta {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .nav-cta a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 700;
  }

  .nav-cta a:first-child {
    color: #0f172a;
    background: rgba(15, 23, 42, 0.05);
  }

  .nav-cta a:last-child {
    color: white;
    background: linear-gradient(135deg, #0369a1, #0f766e);
  }

  .wallet-summary {
    padding: 14px 16px;
    border-radius: 20px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: rgba(255, 255, 255, 0.78);
    text-decoration: none;
    color: #0f172a;
  }

  .wallet-summary[hidden] {
    display: none !important;
  }

  .wallet-summary-label {
    color: #64748b;
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .wallet-summary-value {
    margin-top: 8px;
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  .wallet-summary-meta {
    margin-top: 6px;
    color: #475569;
    font-size: 0.88rem;
  }

  @media (max-width: 1040px) {
    .topbar {
      grid-template-columns: 1fr;
    }

    .nav-cta {
      justify-content: flex-start;
    }
  }
`;

export const renderWebNavigation = (input: {
  appName: string;
  pathname: string;
}) => {
  const activeSection = resolveWebNavSection(input.pathname);
  const safeAppName = escapeHtml(input.appName);

  return `
    <header class="topbar">
      <div class="topbar-brand">
        <strong>${safeAppName}</strong>
        <span>Portal do usuario para explorar mercados, operar e acompanhar portfolio.</span>
      </div>

      <div class="nav-group" aria-label="Navegacao principal do portal">
        <div class="nav-group-label">Explorar</div>
        ${renderLinks(PUBLIC_ITEMS, activeSection)}
        ${renderLinks(ACCESS_ITEMS, activeSection)}
      </div>

      <a id="wallet-summary" class="wallet-summary" href="/wallet" hidden>
        <div class="wallet-summary-label">Carteira</div>
        <div id="wallet-summary-value" class="wallet-summary-value">Saldo indisponivel</div>
        <div id="wallet-summary-meta" class="wallet-summary-meta">Entre para consultar seu saldo.</div>
      </a>

      <div class="nav-cta" aria-label="Acesso e onboarding">
        ${renderLinks(AUTH_ITEMS, activeSection)}
      </div>
    </header>
  `;
};

export const renderWalletHeaderScript = () => `
  const walletSummary = document.getElementById("wallet-summary");
  const walletSummaryValue = document.getElementById("wallet-summary-value");
  const walletSummaryMeta = document.getElementById("wallet-summary-meta");

  const formatWalletAmount = (value, currency) => {
    const amount = Number(value || 0);
    const normalized = Number.isFinite(amount) ? amount.toFixed(2) : String(value || "0.00");
    return currency ? normalized + " " + currency : normalized;
  };

  const syncWalletHeader = async () => {
    if (!walletSummary || !window.ProjetoAlfaWebSession?.get) {
      return;
    }

    const session = window.ProjetoAlfaWebSession.get();

    if (!session?.tokens?.accessToken) {
      walletSummary.hidden = true;
      return;
    }

    try {
      const payload = await window.ProjetoAlfaWebSession.fetchJsonWithAuth(
        "/api/wallet/balance",
        { method: "GET" },
        "Nao foi possivel carregar seu saldo.",
      );
      const balance = payload?.balance;

      if (!balance) {
        walletSummary.hidden = true;
        return;
      }

      walletSummary.hidden = false;
      walletSummaryValue.textContent = formatWalletAmount(balance.total, balance.currency);
      walletSummaryMeta.textContent =
        "Disponivel " + formatWalletAmount(balance.available, balance.currency) +
        " • Reservado " + formatWalletAmount(balance.reserved, balance.currency);
    } catch (error) {
      if (error?.code === "unauthenticated") {
        walletSummary.hidden = true;
        return;
      }

      walletSummary.hidden = false;
      walletSummaryValue.textContent = "Saldo indisponivel";
      walletSummaryMeta.textContent = error?.message || "Nao foi possivel atualizar a carteira no momento.";
    }
  };

  syncWalletHeader();
`;
