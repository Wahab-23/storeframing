import { z } from "zod";

export const orderStatusValues = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "PARTIALLY_SHIPPED",
    "SHIPPED",
    "PARTIALLY_DELIVERED",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
    "PARTIALLY_REFUNDED",
    "REFUNDED",
] as const;

export const orderDetailSchema = z.object({
    id: z.string().cuid2(),
});

export const cancelOrderSchema = z.object({
    reason: z.string().trim().max(500).optional(),
});

export const sellerOrderUpdateStatusSchema = z.object({
    status: z.enum([
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "READY_TO_SHIP",
        "SHIPPED",
        "PARTIALLY_DELIVERED",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
        "PARTIALLY_REFUNDED",
        "REFUNDED",
    ] as const),
});
