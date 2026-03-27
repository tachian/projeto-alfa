import type { AuthServiceContract } from "./service.js";
import { AuthError } from "./service.js";
import { verifyAccessToken } from "./tokens.js";

export const getAuthenticatedUserUuid = async (
  authorizationHeader: string | undefined,
  authService: AuthServiceContract,
) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AuthError("Token de acesso ausente.", 401);
  }

  const accessToken = authorizationHeader.replace("Bearer ", "");

  try {
    const payload = verifyAccessToken(accessToken);
    await authService.getCurrentUser(payload.sub);

    return payload.sub;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    throw new AuthError("Token de acesso invalido.", 401);
  }
};
