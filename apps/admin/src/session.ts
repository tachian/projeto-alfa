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

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

export type AdminRouteAccessOutcome =
  | { kind: "redirect" }
  | { kind: "denied" }
  | { kind: "granted"; user: AdminSessionUser };

type FetchJsonOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export const ADMIN_SESSION_STORAGE_KEY = "projeto-alfa.admin.session";
export const ADMIN_TOKEN_STORAGE_KEY = "projeto-alfa.admin.token";

export const buildAdminLoginRedirectUrl = (origin: string, reason = "") => {
  const url = new URL("/login", origin);

  if (reason) {
    url.searchParams.set("reason", reason);
  }

  return url.toString();
};

export const resolveAdminRouteAccess = (input: {
  accessToken?: string | null;
  user?: AdminSessionUser | null;
}): AdminRouteAccessOutcome => {
  if (!input.accessToken) {
    return { kind: "redirect" };
  }

  if (!input.user) {
    return { kind: "redirect" };
  }

  if (input.user.role !== "admin") {
    return { kind: "denied" };
  }

  return {
    kind: "granted",
    user: input.user,
  };
};

export const createAdminSessionClient = (input: {
  storage: StorageLike;
  fetch: FetchLike;
  origin: string;
  redirect: (url: string) => void;
}) => {
  const createSessionError = (code: string, message: string) => {
    const error = new Error(message) as Error & { code?: string };
    error.code = code;
    return error;
  };

  const readStoredJson = (key: string) => {
    try {
      const value = input.storage.getItem(key);
      return value ? (JSON.parse(value) as AdminSession) : null;
    } catch {
      return null;
    }
  };

  const writeStoredJson = (key: string, value: AdminSession) => {
    input.storage.setItem(key, JSON.stringify(value));
  };

  return {
    get() {
      return readStoredJson(ADMIN_SESSION_STORAGE_KEY);
    },
    save(session: AdminSession) {
      writeStoredJson(ADMIN_SESSION_STORAGE_KEY, session);
      if (session?.tokens?.accessToken) {
        input.storage.setItem(ADMIN_TOKEN_STORAGE_KEY, session.tokens.accessToken);
      } else {
        input.storage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      }
    },
    clear() {
      input.storage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      input.storage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    },
    updateUser(user: AdminSessionUser) {
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

      return input.storage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? "";
    },
    setAccessToken(accessToken: string) {
      const session = this.get();

      if (session?.tokens) {
        session.tokens.accessToken = accessToken;
        this.save(session);
        return;
      }

      if (accessToken) {
        input.storage.setItem(ADMIN_TOKEN_STORAGE_KEY, accessToken);
      } else {
        input.storage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      }
    },
    async refresh() {
      const session = this.get();
      const refreshToken = session?.tokens?.refreshToken;

      if (!refreshToken) {
        this.clear();
        throw createSessionError("unauthenticated", "Refresh token ausente.");
      }

      const response = await input.fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

        const payloadText = await response.text();
        const payload = payloadText ? (JSON.parse(payloadText) as AdminSession | { message?: string }) : null;

        if (!response.ok) {
          const payloadMessage =
            payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;
          this.clear();
          throw createSessionError(
            "unauthenticated",
            payloadMessage ?? "Nao foi possivel renovar a sessao.",
          );
        }

      this.save(payload as AdminSession);
      return payload as AdminSession;
    },
    async fetchWithAuth(url: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
      const execute = async () => {
        const token = this.getAccessToken();
        const headers = {
          ...(options.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        return input.fetch(url, {
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
    async fetchJsonWithAuth(url: string, options: FetchJsonOptions = {}, fallbackMessage = "Nao foi possivel concluir a operacao.") {
      const response = await this.fetchWithAuth(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
      });

      const payloadText = await response.text();
      const payload = payloadText ? (JSON.parse(payloadText) as { message?: string; user?: AdminSessionUser }) : null;

      if (!response.ok) {
        if (response.status === 401) {
          this.clear();
          throw createSessionError("unauthenticated", payload?.message ?? "Sua sessao expirou.");
        }

        if (response.status === 403) {
          throw createSessionError("forbidden", payload?.message ?? "Acesso restrito a administradores.");
        }

        throw createSessionError("request_failed", payload?.message ?? fallbackMessage);
      }

      return payload;
    },
    async resolveAdminUser() {
      const accessToken = this.getAccessToken();

      if (!accessToken) {
        throw createSessionError("unauthenticated", "Sessao ausente.");
      }

      const payload = await this.fetchJsonWithAuth("/api/auth/me", { method: "GET" }, "Nao foi possivel validar a sessao.");
      const user = payload?.user;

      if (!user) {
        this.clear();
        throw createSessionError("unauthenticated", "Sessao invalida.");
      }

      this.updateUser(user);

      if (user.role !== "admin") {
        throw createSessionError("forbidden", "Acesso restrito a administradores.");
      }

      return user;
    },
    buildLoginRedirectUrl(reason = "") {
      return buildAdminLoginRedirectUrl(input.origin, reason);
    },
    logout(reason = "") {
      this.clear();
      input.redirect(this.buildLoginRedirectUrl(reason));
    },
  };
};

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
            throw createProjetoAlfaSessionError("unauthenticated", payload?.message ?? "Sua sessao expirou.");
          }

          if (response.status === 403) {
            throw createProjetoAlfaSessionError("forbidden", payload?.message ?? "Acesso restrito a administradores.");
          }

          throw createProjetoAlfaSessionError("request_failed", payload?.message ?? fallbackMessage);
        }

        return payload;
      },
      async resolveAdminUser() {
        const accessToken = this.getAccessToken();

        if (!accessToken) {
          throw createProjetoAlfaSessionError("unauthenticated", "Sessao ausente.");
        }

        const payload = await this.fetchJsonWithAuth("/api/auth/me", { method: "GET" }, "Nao foi possivel validar a sessao.");
        const user = payload?.user;

        if (!user) {
          this.clear();
          throw createProjetoAlfaSessionError("unauthenticated", "Sessao invalida.");
        }

        this.updateUser(user);

        if (user.role !== "admin") {
          throw createProjetoAlfaSessionError("forbidden", "Acesso restrito a administradores.");
        }

        return user;
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
