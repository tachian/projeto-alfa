import { renderPortalPage } from "./portal-page.js";

export const renderHomePage = (input: {
  appName: string;
  pathname: string;
}) =>
  renderPortalPage({
    appName: input.appName,
    pathname: input.pathname,
    eyebrow: "Portal",
    title: "Predicao para usuarios comuns, sem atrito desnecessario.",
    description:
      "Explore mercados, crie sua conta, acompanhe book e operacoes, e consulte portfolio em uma experiencia separada do painel administrativo.",
    cards: [
      {
        title: "Criar conta",
        description: "Onboarding inicial com nome, email, telefone e senha.",
        href: "/register",
        tone: "accent",
      },
      {
        title: "Mercados",
        description: "Catalogo publico com contratos, regras e fontes oficiais.",
        href: "/markets",
      },
      {
        title: "Portfolio",
        description: "Area autenticada para posicoes, PnL e historico de liquidacoes.",
        href: "/portfolio",
      },
    ],
  });
