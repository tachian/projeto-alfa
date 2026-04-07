import { escapeHtml } from "./html.js";

export type AdminNavSection = "dashboard" | "markets" | "trading" | "portfolio";

type AdminNavItem = {
  href: string;
  label: string;
  section: AdminNavSection;
};

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/", label: "Dashboard", section: "dashboard" },
  { href: "/markets", label: "Mercados", section: "markets" },
  { href: "/trading", label: "Trading", section: "trading" },
  { href: "/portfolio", label: "Portfolio", section: "portfolio" },
];

export const resolveAdminNavSection = (pathname: string): AdminNavSection => {
  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    return "dashboard";
  }

  if (pathname.startsWith("/markets")) {
    return "markets";
  }

  if (pathname.startsWith("/trading")) {
    return "trading";
  }

  if (pathname.startsWith("/portfolio")) {
    return "portfolio";
  }

  return "dashboard";
};

export const renderAdminChromeStyles = () => `
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    margin-bottom: 18px;
    padding: 14px 18px;
    border-radius: 22px;
    border: 1px solid rgba(98, 60, 28, 0.12);
    background:
      linear-gradient(135deg, rgba(255, 251, 245, 0.96), rgba(248, 232, 214, 0.88)),
      rgba(255, 251, 245, 0.9);
    box-shadow: 0 16px 48px rgba(68, 42, 18, 0.1);
  }

  .topbar-brand {
    min-width: 0;
  }

  .topbar-brand strong {
    display: block;
    color: #1b1510;
    font-size: 1rem;
  }

  .topbar-brand span {
    display: block;
    margin-top: 2px;
    color: #6d5f4f;
    font-size: 0.84rem;
  }

  .topnav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .topnav a {
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(76, 51, 24, 0.1);
    text-decoration: none;
    color: #6d5f4f;
    background: rgba(255, 255, 255, 0.62);
    font-weight: 600;
    transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
  }

  .topnav a[aria-current="page"] {
    background: rgba(177, 77, 45, 0.12);
    color: #b14d2d;
    border-color: rgba(177, 77, 45, 0.22);
  }

  .topnav a:hover {
    color: #1b1510;
    border-color: rgba(76, 51, 24, 0.16);
  }
`;

export const renderAdminNavigation = (input: {
  appName: string;
  pathname: string;
}) => {
  const activeSection = resolveAdminNavSection(input.pathname);
  const safeAppName = escapeHtml(input.appName);

  const links = ADMIN_NAV_ITEMS.map((item) => {
    const current = item.section === activeSection ? ' aria-current="page"' : "";
    return `<a href="${item.href}"${current}>${item.label}</a>`;
  }).join("");

  return `
    <header class="topbar">
      <div class="topbar-brand">
        <strong>${safeAppName}</strong>
        <span>Painel administrativo operacional</span>
      </div>
      <nav class="topnav" aria-label="Menu principal do admin">
        ${links}
      </nav>
    </header>
  `;
};
