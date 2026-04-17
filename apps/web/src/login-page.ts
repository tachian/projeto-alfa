import { renderAuthPage } from "./auth-page.js";

export const renderLoginPage = (input: { appName: string }) =>
  renderAuthPage({
    appName: input.appName,
    mode: "login",
  });
