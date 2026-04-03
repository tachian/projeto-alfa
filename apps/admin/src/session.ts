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
    };

    window.ProjetoAlfaSession = projetoAlfaSession;
  `;
};
