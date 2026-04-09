import { renderPortalPage } from "./portal-page.js";

export const renderWorkspacePage = (input: {
  appName: string;
  pathname: string;
  eyebrow: string;
  title: string;
  description: string;
  status?: string;
  cards: Array<{
    title: string;
    description: string;
    href: string;
    tone?: "default" | "accent";
  }>;
}) =>
  renderPortalPage({
    appName: input.appName,
    pathname: input.pathname,
    eyebrow: input.eyebrow,
    title: input.title,
    description: input.description,
    status: input.status,
    cards: input.cards,
  });
