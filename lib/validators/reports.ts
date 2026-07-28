import { z } from "zod";

const auditActionValues = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "APPROVE",
    "REJECT",
    "SUSPEND",
    "RESTORE",
] as const;

export const dateRangeQuerySchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
});

export const auditLogsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    action: z.enum(auditActionValues).optional(),
    entityType: z.string().trim().min(1).max(100).optional(),
    entityId: z.string().trim().min(1).max(100).optional(),
    userId: z.string().cuid2().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
});
