import { describe, expect, it } from "vitest";

import { renderPortalPage } from "./portal-page.js";

describe("renderPortalPage", () => {
  it("renders the shared portal shell and workspace cards", () => {
    const html = renderPortalPage({
      appName: "projeto-alfa-web",
      pathname: "/register",
      eyebrow: "Criar conta",
      title: "Onboarding inicial",
      description: "Use esta area para cadastrar novos usuarios.",
      status: "Proxima etapa: integrar o formulario real.",
      cards: [
        {
          title: "Cadastro",
          description: "Coleta de nome, email, telefone e senha.",
          href: "/register",
          tone: "accent",
        },
      ],
    });

    expect(html).toContain('aria-label="Navegacao principal do portal"');
    expect(html).toContain("Fundacao do portal");
    expect(html).toContain("Proxima etapa: integrar o formulario real.");
    expect(html).toContain("Cadastro");
    expect(html).toContain('href="/register" aria-current="page"');
  });
});
