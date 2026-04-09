export type AuthUser = {
  uuid: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};

export type AuthResult = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type RegisterInput = {
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
