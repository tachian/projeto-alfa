export type WebSessionUser = {
  uuid: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
};

export type WebSessionTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};

export type WebSession = {
  user: WebSessionUser;
  tokens: WebSessionTokens;
};

export const WEB_SESSION_STORAGE_KEY = "projeto-alfa.web.session";

export const renderSessionClientScript = () => `
  const projetoAlfaWebSessionKey = ${JSON.stringify(WEB_SESSION_STORAGE_KEY)};

  const createProjetoAlfaWebSessionError = (code, message) => {
    const error = new Error(message);
    error.code = code;
    return error;
  };

  const readProjetoAlfaWebSession = () => {
    try {
      const value = localStorage.getItem(projetoAlfaWebSessionKey);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  const normalizeProjetoAlfaReturnTo = (value) => {
    if (!value || typeof value !== "string") {
      return "";
    }

    if (!value.startsWith("/")) {
      return "";
    }

    if (value.startsWith("//")) {
      return "";
    }

    return value;
  };

  const projetoAlfaWebSession = {
    get() {
      return readProjetoAlfaWebSession();
    },
    save(session) {
      localStorage.setItem(projetoAlfaWebSessionKey, JSON.stringify(session));
    },
    clear() {
      localStorage.removeItem(projetoAlfaWebSessionKey);
    },
    getAccessToken() {
      return this.get()?.tokens?.accessToken ?? "";
    },
    updateUser(user) {
      const session = this.get();
      if (!session) {
        return;
      }

      session.user = user;
      this.save(session);
    },
    async refresh() {
      const refreshToken = this.get()?.tokens?.refreshToken;

      if (!refreshToken) {
        this.clear();
        throw createProjetoAlfaWebSessionError("unauthenticated", "Sessao ausente.");
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      const payloadText = await response.text();
      const payload = payloadText ? JSON.parse(payloadText) : null;

      if (!response.ok) {
        this.clear();
        throw createProjetoAlfaWebSessionError("unauthenticated", payload?.message ?? "Sua sessao expirou.");
      }

      this.save(payload);
      return payload;
    },
    async fetchWithAuth(url, options = {}) {
      const execute = async () => {
        const token = this.getAccessToken();

        return fetch(url, {
          ...options,
          headers: {
            ...(options.headers ?? {}),
            ...(token ? { Authorization: "Bearer " + token } : {}),
          },
        });
      };

      let response = await execute();

      if (response.status !== 401) {
        return response;
      }

      await this.refresh();
      response = await execute();
      return response;
    },
    async fetchJsonWithAuth(url, options = {}, fallbackMessage = "Nao foi possivel concluir a operacao.") {
      const response = await this.fetchWithAuth(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
      });

      const payloadText = await response.text();
      const payload = payloadText ? JSON.parse(payloadText) : null;

      if (!response.ok) {
        if (response.status === 401) {
          this.clear();
          throw createProjetoAlfaWebSessionError("unauthenticated", payload?.message ?? "Sua sessao expirou.");
        }

        throw createProjetoAlfaWebSessionError("request_failed", payload?.message ?? fallbackMessage);
      }

      return payload;
    },
    async resolveUser() {
      const accessToken = this.getAccessToken();

      if (!accessToken) {
        throw createProjetoAlfaWebSessionError("unauthenticated", "Sessao ausente.");
      }

      const payload = await this.fetchJsonWithAuth("/api/auth/me", {
        method: "GET",
      }, "Nao foi possivel validar a sessao.");

      if (!payload?.user) {
        this.clear();
        throw createProjetoAlfaWebSessionError("unauthenticated", "Nao foi possivel validar a sessao.");
      }

      this.updateUser(payload.user);
      return payload.user;
    },
    getCurrentPath() {
      return window.location.pathname + window.location.search;
    },
    buildLoginUrl(reason = "protected", returnTo = this.getCurrentPath()) {
      const url = new URL("/login", window.location.origin);
      const safeReturnTo = normalizeProjetoAlfaReturnTo(returnTo);

      if (reason) {
        url.searchParams.set("reason", reason);
      }

      if (safeReturnTo) {
        url.searchParams.set("returnTo", safeReturnTo);
      }

      return url.toString();
    },
    redirectToLogin(reason = "protected", returnTo = this.getCurrentPath()) {
      window.location.href = this.buildLoginUrl(reason, returnTo);
    },
    logout(reason = "logged-out") {
      this.clear();
      this.redirectToLogin(reason, "");
    },
  };

  window.ProjetoAlfaWebSession = projetoAlfaWebSession;
`;
