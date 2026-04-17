import { describe, expect, it } from "vitest";

import { renderVerificationPage } from "./verification-page.js";

describe("renderVerificationPage", () => {
  it("renders the verification workspace with status, requirements and submission form", () => {
    const html = renderVerificationPage({
      appName: "projeto-alfa-web",
      pathname: "/account/verification",
    });

    expect(html).toContain("Conclua sua verificacao para negociar.");
    expect(html).toContain('id="verification-form"');
    expect(html).toContain("/api/kyc/submissions/latest");
    expect(html).toContain("/api/kyc/requirements");
    expect(html).toContain("/api/kyc/submissions");
  });
});
