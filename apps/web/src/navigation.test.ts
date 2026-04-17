import { describe, expect, it } from "vitest";

import { renderWebNavigation, resolveWebNavSection } from "./navigation.js";

describe("web navigation", () => {
  it("resolves the active section from the pathname", () => {
    expect(resolveWebNavSection("/")).toBe("home");
    expect(resolveWebNavSection("/markets")).toBe("markets");
    expect(resolveWebNavSection("/wallet")).toBe("wallet");
    expect(resolveWebNavSection("/payments")).toBe("payments");
    expect(resolveWebNavSection("/orders")).toBe("orders");
    expect(resolveWebNavSection("/portfolio")).toBe("portfolio");
    expect(resolveWebNavSection("/account/profile")).toBe("account");
    expect(resolveWebNavSection("/login")).toBe("login");
    expect(resolveWebNavSection("/register")).toBe("register");
  });

  it("renders public and authenticated navigation groups", () => {
    const html = renderWebNavigation({
      appName: "projeto-alfa-web",
      pathname: "/markets",
    });

    expect(html).toContain("Navegacao principal do portal");
    expect(html).not.toContain("Explorar");
    expect(html).toContain('href="/markets" aria-current="page"');
    expect(html).toContain('href="/wallet"');
    expect(html).toContain('href="/payments"');
    expect(html).toContain('href="/orders"');
    expect(html).toContain('href="/account/profile"');
    expect(html).toContain('href="/register"');
    expect(html).toContain('id="wallet-summary"');
  });
});
