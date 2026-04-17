import { describe, expect, it } from "vitest";

import { renderWorkspacePage } from "./workspace-page.js";

describe("renderWorkspacePage", () => {
  it("renders the shared admin navigation and protected workspace shell", () => {
    const html = renderWorkspacePage({
      appName: "projeto-alfa-admin",
      pathname: "/trading",
      eyebrow: "Trading",
      title: "Mesa operacional",
      description: "Use esta area para enviar ordens e acompanhar execucoes.",
      cards: [
        {
          title: "Nova ordem",
          description: "Entrada operacional para novas ordens.",
          href: "/trading",
          tone: "accent",
        },
      ],
    });

    expect(html).toContain('aria-label="Menu principal do admin"');
    expect(html).toContain('href="/trading" aria-current="page"');
    expect(html).toContain("window.ProjetoAlfaSession");
    expect(html).toContain("/api/auth/me");
    expect(html).toContain("Trocar conta");
    expect(html).toContain('logout("logged-out")');
    expect(html).toContain("Nova ordem");
  });
});
