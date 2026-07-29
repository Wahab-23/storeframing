import { z } from "zod";

const inventoryMovementTypeValues = [
    "INBOUND",
    "SALE",
    "RETURN",
    "REFUND",
    "ADJUSTMENT",
    "DAMAGE",
    "RESERVED",
    "RELEASED",
] as const;

export const updateInventorySchema = z.object({
    quantity: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).optional(),
});

export const inventoryAdjustmentSchema = z.object({
    type: z.enum(["INBOUND", "ADJUSTMENT", "DAMAGE", "RETURN"] as const),
    quantity: z.number().int().positive(),
    note: z.string().trim().max(1000).optional(),
});

export const inventoryMovementsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(inventoryMovementTypeValues).optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
});
