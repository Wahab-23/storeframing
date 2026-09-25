import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { auditLogsQuerySchema } from "@/lib/validators/reports";
import { serializeAdminPagination } from "./dto";

type ListAuditLogsInput = {
    query: unknown;
};

export async function listAuditLogs({ query }: ListAuditLogsInput) {
    const parsed = auditLogsQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, action, search, entityType, entityId, userId, from, to } =
        parsed.data;

    const where = {
        ...(action ? { action } : {}),
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(userId ? { userId } : {}),
        ...(search
            ? {
                  OR: [
                      { entityType: { contains: search, mode: "insensitive" as const } },
                      { entityId: { contains: search, mode: "insensitive" as const } },
                      { userId: { contains: search, mode: "insensitive" as const } },
                      {
                          user: {
                              is: {
                                  OR: [
                                      { email: { contains: search, mode: "insensitive" as const } },
                                      { firstName: { contains: search, mode: "insensitive" as const } },
                                      { lastName: { contains: search, mode: "insensitive" as const } },
                                  ],
                              },
                          },
                      },
                  ],
              }
            : {}),
        ...((from || to)
            ? {
                  createdAt: {
                      ...(from ? { gte: new Date(from) } : {}),
                      ...(to ? { lte: new Date(to) } : {}),
                  },
              }
            : {}),
    };

    const [logs, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                userId: true,
                action: true,
                entityType: true,
                entityId: true,
                oldData: true,
                newData: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);

    return {
        status: 200,
        message: "Audit logs fetched successfully.",
        data: {
            logs,
            pagination: serializeAdminPagination(page, limit, total),
        },
    };
}
