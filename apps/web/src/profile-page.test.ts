import { describe, expect, it } from "vitest";

import { renderProfilePage } from "./profile-page.js";

describe("renderProfilePage", () => {
  it("renders the real profile management form", () => {
    const html = renderProfilePage({
      appName: "projeto-alfa-web",
      pathname: "/account/profile",
    });

    expect(html).toContain("Manutencao cadastral");
    expect(html).toContain('id="profile-form"');
    expect(html).toContain('id="profile-name"');
    expect(html).toContain('id="profile-email"');
    expect(html).toContain('id="profile-phone"');
    expect(html).toContain("/api/users/me");
    expect(html).toContain("window.ProjetoAlfaWebSession");
  });
});
