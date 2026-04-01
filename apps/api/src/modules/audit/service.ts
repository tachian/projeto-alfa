import { prisma } from "../../lib/prisma.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export type AuditLogRecord = {
  uuid: string;
  requestUuid: string | null;
  actorType: string;
  actorUuid: string | null;
  action: string;
  targetType: string;
  targetUuid: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  payload: unknown;
  createdAt: Date;
};

export type ListAuditLogsInput = {
  actorUuid?: string;
  action?: string;
  targetType?: string;
  targetUuid?: string;
  requestUuid?: string;
  limit?: number;
};

export type ListAuditLogsResult = {
  items: AuditLogRecord[];
  meta: {
    count: number;
    limit: number;
  };
};

export interface AuditServiceContract {
  listAuditLogs(input: ListAuditLogsInput): Promise<ListAuditLogsResult>;
}

const mapAuditLog = (log: {
  uuid: string;
  requestUuid: string | null;
  actorType: string;
  actorUuid: string | null;
  action: string;
  targetType: string;
  targetUuid: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  payload: unknown;
  createdAt: Date;
}): AuditLogRecord => ({
  uuid: log.uuid,
  requestUuid: log.requestUuid,
  actorType: log.actorType,
  actorUuid: log.actorUuid,
  action: log.action,
  targetType: log.targetType,
  targetUuid: log.targetUuid,
  ipAddress: log.ipAddress,
  userAgent: log.userAgent,
  payload: log.payload,
  createdAt: log.createdAt,
});

export class AuditService implements AuditServiceContract {
  async listAuditLogs(input: ListAuditLogsInput): Promise<ListAuditLogsResult> {
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

    const items = await prisma.auditLog.findMany({
      where: {
        actorUuid: input.actorUuid,
        action: input.action,
        targetType: input.targetType,
        targetUuid: input.targetUuid,
        requestUuid: input.requestUuid,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return {
      items: items.map(mapAuditLog),
      meta: {
        count: items.length,
        limit,
      },
    };
  }
}
