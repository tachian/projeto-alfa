import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { AuthError } from "../auth/service.js";

export type UserProfile = {
  uuid: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateUserProfileInput = {
  userUuid: string;
  name?: string;
  email?: string;
  phone?: string;
};

export interface UserServiceContract {
  getProfile(userUuid: string): Promise<UserProfile>;
  updateProfile(input: UpdateUserProfileInput): Promise<UserProfile>;
}

const mapUserProfile = (user: {
  uuid: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  uuid: user.uuid,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class UserService implements UserServiceContract {
  async getProfile(userUuid: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: {
        uuid: userUuid,
      },
    });

    if (!user) {
      throw new AuthError("Usuario nao encontrado.", 404);
    }

    return mapUserProfile(user);
  }

  async updateProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
    const currentUser = await prisma.user.findUnique({
      where: {
        uuid: input.userUuid,
      },
    });

    if (!currentUser) {
      throw new AuthError("Usuario nao encontrado.", 404);
    }

    if (input.email && input.email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (existingUser && existingUser.uuid !== input.userUuid) {
        throw new AuthError("Email ja cadastrado.", 409);
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        uuid: input.userUuid,
      },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      },
    });

    await writeAuditLog({
      action: "user.profile.update",
      targetType: "user",
      targetUuid: updatedUser.uuid,
      payload: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
      },
    });

    return mapUserProfile(updatedUser);
  }
}
