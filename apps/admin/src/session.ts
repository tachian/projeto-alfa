export type AdminSessionUser = {
  uuid: string;
  email: string;
  role: string;
  status: string;
};

export type AdminSessionTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};

export type AdminSession = {
  user: AdminSessionUser;
  tokens: AdminSessionTokens;
};

export const ADMIN_SESSION_STORAGE_KEY = "projeto-alfa.admin.session";
export const ADMIN_TOKEN_STORAGE_KEY = "projeto-alfa.admin.token";

export const renderSessionClientScript = () => {
  return `
    const projetoAlfaSessionStorageKey = ${JSON.stringify(ADMIN_SESSION_STORAGE_KEY)};
    const projetoAlfaTokenStorageKey = ${JSON.stringify(ADMIN_TOKEN_STORAGE_KEY)};

    const createProjetoAlfaSessionError = (code, message) => {
      const error = new Error(message);
      error.code = code;
      return error;
    };

    const readStoredJson = (key) => {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    };

    const writeStoredJson = (key, value) => {
      localStorage.setItem(key, JSON.stringify(value));
    };

    const projetoAlfaSession = {
      storageKey: projetoAlfaSessionStorageKey,
      tokenStorageKey: projetoAlfaTokenStorageKey,
      get() {
        return readStoredJson(projetoAlfaSessionStorageKey);
      },
      save(session) {
        writeStoredJson(projetoAlfaSessionStorageKey, session);
        if (session?.tokens?.accessToken) {
          localStorage.setItem(projetoAlfaTokenStorageKey, session.tokens.accessToken);
        } else {
          localStorage.removeItem(projetoAlfaTokenStorageKey);
        }
      },
      clear() {
        localStorage.removeItem(projetoAlfaSessionStorageKey);
        localStorage.removeItem(projetoAlfaTokenStorageKey);
      },
      updateUser(user) {
        const session = this.get();
        if (!session) {
          return;
        }

        session.user = user;
        this.save(session);
      },
      getAccessToken() {
        const session = this.get();
        if (session?.tokens?.accessToken) {
          return session.tokens.accessToken;
        }

        return localStorage.getItem(projetoAlfaTokenStorageKey) ?? "";
      },
      setAccessToken(accessToken) {
        const session = this.get();

        if (session?.tokens) {
          session.tokens.accessToken = accessToken;
          this.save(session);
          return;
        }

        if (accessToken) {
          localStorage.setItem(projetoAlfaTokenStorageKey, accessToken);
        } else {
          localStorage.removeItem(projetoAlfaTokenStorageKey);
        }
      },
      async refresh() {
        const session = this.get();
        const refreshToken = session?.tokens?.refreshToken;

        if (!refreshToken) {
          this.clear();
          throw createProjetoAlfaSessionError("unauthenticated", "Refresh token ausente.");
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
          throw createProjetoAlfaSessionError(
            "unauthenticated",
            payload?.message ?? "Nao foi possivel renovar a sessao.",
          );
        }

        this.save(payload);
        return payload;
      },
      async fetchWithAuth(url, options = {}) {
        const execute = async () => {
          const token = this.getAccessToken();
          const headers = {
            ...(options.headers ?? {}),
            ...(token ? { Authorization: "Bearer " + token } : {}),
          };

          return fetch(url, {
            ...options,
            headers,
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
      requireAdminSession(user) {
        if (!user) {
          throw createProjetoAlfaSessionError("unauthenticated", "Sessao ausente.");
        }

        if (user.role !== "admin") {
          throw createProjetoAlfaSessionError("forbidden", "Acesso restrito a administradores.");
        }

        return user;
      },
      buildLoginRedirectUrl(reason) {
        const url = new URL("/login", window.location.origin);

        if (reason) {
          url.searchParams.set("reason", reason);
        }

        return url.toString();
      },
      logout(reason = "") {
        this.clear();
        window.location.href = this.buildLoginRedirectUrl(reason);
      },
    };

    window.ProjetoAlfaSession = projetoAlfaSession;
  `;
};
