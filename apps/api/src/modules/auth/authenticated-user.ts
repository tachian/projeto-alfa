import type { AuthServiceContract } from "./service.js";
import { AuthError } from "./service.js";
import { verifyAccessToken } from "./tokens.js";

export const getAuthenticatedUser = async (
  authorizationHeader: string | undefined,
  authService: AuthServiceContract,
) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AuthError("Token de acesso ausente.", 401);
  }

  const accessToken = authorizationHeader.replace("Bearer ", "");

  try {
    const payload = verifyAccessToken(accessToken);
    return await authService.getCurrentUser(payload.sub);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    throw new AuthError("Token de acesso invalido.", 401);
  }
};

export const getAuthenticatedUserUuid = async (
  authorizationHeader: string | undefined,
  authService: AuthServiceContract,
) => {
  const user = await getAuthenticatedUser(authorizationHeader, authService);
  return user.uuid;
};

export const requireAdminUser = async (
  authorizationHeader: string | undefined,
  authService: AuthServiceContract,
) => {
  const user = await getAuthenticatedUser(authorizationHeader, authService);

  if (user.role !== "admin") {
    throw new AuthError("Acesso restrito a administradores.", 403);
  }

  return user;
};
