import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { requestContext } from "./request-context.js";

export type AuditEvent = {
  actorType?: string;
  actorUuid?: string;
  action: string;
  targetType: string;
  targetUuid?: string;
  payload?: Prisma.InputJsonValue;
};

export const writeAuditLog = async (event: AuditEvent) => {
  const context = requestContext.get();

  await prisma.auditLog.create({
    data: {
      requestUuid: context?.requestUuid,
      actorType: event.actorType ?? context?.actorType ?? "system",
      actorUuid: event.actorUuid ?? context?.actorUuid,
      action: event.action,
      targetType: event.targetType,
      targetUuid: event.targetUuid,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      payload: event.payload,
    },
  });
};
