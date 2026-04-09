import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { appConfig } from "../../config.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requestContext } from "../../lib/request-context.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  generateRefreshTokenId,
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./tokens.js";
import type { AuthResult, AuthTokens, LoginInput, RegisterInput } from "./types.js";

export type CurrentUser = {
  uuid: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface AuthServiceContract {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  refresh(refreshToken: string): Promise<AuthResult>;
  getCurrentUser(userUuid: string): Promise<CurrentUser>;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const computeExpiryDate = (token: string) => {
  const decoded = jwt.decode(token, { json: true });

  if (!decoded?.exp) {
    throw new AuthError("Nao foi possivel calcular a expiracao do token.", 500);
  }

  return new Date(decoded.exp * 1000);
};

const mapUser = (user: {
  uuid: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  uuid: user.uuid,
  name: user.name ?? null,
  email: user.email,
  phone: user.phone ?? null,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class AuthService implements AuthServiceContract {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existingUser) {
      throw new AuthError("Email ja cadastrado.", 409);
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: "user",
        status: "pending_verification",
      },
    });

    requestContext.setActor({
      actorType: "user",
      actorUuid: user.uuid,
    });

    await writeAuditLog({
      action: "auth.register",
      targetType: "user",
      targetUuid: user.uuid,
      payload: {
        email: user.email,
      },
    });

    const tokens = await this.issueTokens(user.uuid, user.email);

    return {
      user: mapUser(user),
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (!user) {
      throw new AuthError("Credenciais invalidas.", 401);
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AuthError("Credenciais invalidas.", 401);
    }

    const tokens = await this.issueTokens(user.uuid, user.email);

    requestContext.setActor({
      actorType: "user",
      actorUuid: user.uuid,
    });

    await writeAuditLog({
      action: "auth.login",
      targetType: "user",
      targetUuid: user.uuid,
    });

    return {
      user: mapUser(user),
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthError("Refresh token invalido.", 401);
    }

    const existingToken = await prisma.refreshToken.findUnique({
      where: {
        uuid: payload.jti,
      },
      include: {
        user: true,
      },
    });

    if (!existingToken || existingToken.revokedAt) {
      throw new AuthError("Refresh token invalido.", 401);
    }

    if (existingToken.expiresAt <= new Date()) {
      throw new AuthError("Refresh token expirado.", 401);
    }

    const receivedTokenHash = hashRefreshToken(refreshToken);

    if (receivedTokenHash !== existingToken.tokenHash) {
      throw new AuthError("Refresh token invalido.", 401);
    }

    await prisma.refreshToken.update({
      where: {
        uuid: existingToken.uuid,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const tokens = await this.issueTokens(existingToken.user.uuid, existingToken.user.email);

    requestContext.setActor({
      actorType: "user",
      actorUuid: existingToken.user.uuid,
    });

    await writeAuditLog({
      action: "auth.refresh",
      targetType: "refresh_token",
      targetUuid: existingToken.uuid,
      payload: {
        userUuid: existingToken.user.uuid,
      },
    });

    return {
      user: mapUser(existingToken.user),
      tokens,
    };
  }

  async getCurrentUser(userUuid: string) {
    const user = await prisma.user.findUnique({
      where: {
        uuid: userUuid,
      },
    });

    if (!user) {
      throw new AuthError("Usuario nao encontrado.", 404);
    }

    return mapUser(user);
  }

  private async issueTokens(userUuid: string, email: string): Promise<AuthTokens> {
    const refreshTokenId = generateRefreshTokenId();
    const accessToken = signAccessToken({
      sub: userUuid,
      email,
    });
    const refreshToken = signRefreshToken({
      sub: userUuid,
      jti: refreshTokenId,
    });

    await prisma.refreshToken.create({
      data: {
        uuid: refreshTokenId,
        userUuid,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: computeExpiryDate(refreshToken),
      },
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: appConfig.JWT_EXPIRES_IN,
      refreshTokenExpiresIn: appConfig.JWT_REFRESH_EXPIRES_IN,
    };
  }
}
