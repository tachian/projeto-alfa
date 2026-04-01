import { prisma } from "../../lib/prisma.js";

export const USER_ACCOUNT_STATUSES = [
  "pending_verification",
  "active",
  "restricted",
  "suspended",
] as const;

export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number];

export class AccountStateError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AccountStateError";
  }
}

export interface AccountStateServiceContract {
  getUserStatus(userUuid: string): Promise<UserAccountStatus>;
  assertCanCreateOrder(userUuid: string): Promise<void>;
  assertCanCreateDeposit(userUuid: string): Promise<void>;
  assertCanCreateWithdrawal(userUuid: string): Promise<void>;
}

const normalizeUserStatus = (status: string): UserAccountStatus => {
  if ((USER_ACCOUNT_STATUSES as readonly string[]).includes(status)) {
    return status as UserAccountStatus;
  }

  return "pending_verification";
};

export class AccountStateService implements AccountStateServiceContract {
  async getUserStatus(userUuid: string): Promise<UserAccountStatus> {
    const user = await prisma.user.findUnique({
      where: {
        uuid: userUuid,
      },
      select: {
        status: true,
      },
    });

    if (!user) {
      throw new AccountStateError("Usuario nao encontrado.", 404);
    }

    return normalizeUserStatus(user.status);
  }

  async assertCanCreateOrder(userUuid: string): Promise<void> {
    const status = await this.getUserStatus(userUuid);

    if (status !== "active") {
      throw new AccountStateError(
        "A conta precisa estar ativa para negociar. Conclua a verificacao ou contate o suporte.",
        403,
      );
    }
  }

  async assertCanCreateDeposit(userUuid: string): Promise<void> {
    const status = await this.getUserStatus(userUuid);

    if (status === "restricted" || status === "suspended") {
      throw new AccountStateError(
        "A conta esta bloqueada para movimentacoes financeiras. Contate o suporte.",
        403,
      );
    }
  }

  async assertCanCreateWithdrawal(userUuid: string): Promise<void> {
    const status = await this.getUserStatus(userUuid);

    if (status !== "active") {
      throw new AccountStateError(
        "A conta precisa estar ativa para saques. Conclua a verificacao ou contate o suporte.",
        403,
      );
    }
  }
}
