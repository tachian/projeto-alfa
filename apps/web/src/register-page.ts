import { renderAuthPage } from "./auth-page.js";

export const renderRegisterPage = (input: { appName: string }) =>
  renderAuthPage({
    appName: input.appName,
    mode: "register",
  });
