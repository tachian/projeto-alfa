import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { appConfig } from "../../config.js";

type AccessTokenPayload = {
  sub: string;
  email: string;
  type: "access";
};

type RefreshTokenPayload = {
  sub: string;
  jti: string;
  type: "refresh";
};

export const generateRefreshTokenId = () => {
  return crypto.randomUUID();
};

export const hashRefreshToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const accessTokenExpiresIn = appConfig.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"];
const refreshTokenExpiresIn = appConfig.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"];

export const signAccessToken = (payload: Omit<AccessTokenPayload, "type">) => {
  return jwt.sign(
    {
      ...payload,
      type: "access",
    },
    appConfig.JWT_SECRET,
    {
      expiresIn: accessTokenExpiresIn,
    },
  );
};

export const signRefreshToken = (payload: Omit<RefreshTokenPayload, "type">) => {
  return jwt.sign(
    {
      ...payload,
      type: "refresh",
    },
    appConfig.JWT_REFRESH_SECRET,
    {
      expiresIn: refreshTokenExpiresIn,
    },
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, appConfig.JWT_SECRET) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, appConfig.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};
