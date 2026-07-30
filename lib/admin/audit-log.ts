import { AuditAction, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type CreateAuditLogInput = {
    userId?: string | null;
    action: AuditAction;
    entityType: string;
    entityId: string;
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
};

/**
 * Creates an immutable AuditLog entry.
 */
export async function createAuditLog(
    input: CreateAuditLogInput,
    tx?: Prisma.TransactionClient
) {
    const db = tx ?? prisma;

    return db.auditLog.create({
        data: {
            userId: input.userId ?? null,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            ...(input.oldData !== undefined
                ? { oldData: input.oldData === null ? Prisma.DbNull : (input.oldData as Prisma.InputJsonValue) }
                : {}),
            ...(input.newData !== undefined
                ? { newData: input.newData === null ? Prisma.DbNull : (input.newData as Prisma.InputJsonValue) }
                : {}),
            ipAddress: input.ipAddress ?? null,
            userAgent: input.userAgent ?? null,
        },
    });
}
