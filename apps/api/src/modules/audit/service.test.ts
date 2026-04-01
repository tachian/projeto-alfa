import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { AuditService } from "./service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
    },
  },
}));

describe("AuditService", () => {
  const auditService = new AuditService();
  const mockedPrisma = vi.mocked(prisma, true);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists audit logs with filters and limit", async () => {
    mockedPrisma.auditLog.findMany.mockResolvedValue([
      {
        uuid: "audit-uuid",
        requestUuid: "request-uuid",
        actorType: "user",
        actorUuid: "admin-uuid",
        action: "markets.admin.created",
        targetType: "market",
        targetUuid: "market-uuid",
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
        payload: { status: "draft" },
        createdAt: new Date("2026-04-01T18:00:00.000Z"),
      },
    ] as never);

    await expect(
      auditService.listAuditLogs({
        actorUuid: "admin-uuid",
        targetType: "market",
        limit: 20,
      }),
    ).resolves.toMatchObject({
      items: [
        {
          uuid: "audit-uuid",
          action: "markets.admin.created",
        },
      ],
      meta: {
        count: 1,
        limit: 20,
      },
    });

    expect(mockedPrisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        actorUuid: "admin-uuid",
        action: undefined,
        targetType: "market",
        targetUuid: undefined,
        requestUuid: undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });
  });
});
