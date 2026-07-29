import { z } from "zod";

const returnReasonValues = [
    "DAMAGED",
    "DEFECTIVE",
    "WRONG_ITEM",
    "NOT_AS_DESCRIBED",
    "CHANGED_MIND",
    "OTHER",
] as const;

export const createReturnRequestSchema = z.object({
    orderId: z.string().cuid2(),
    reason: z.enum(returnReasonValues),
    description: z.string().trim().max(5000).optional().nullable(),
    items: z.array(
        z.object({
            orderItemId: z.string().cuid2(),
            quantity: z.number().int().min(1),
        })
    ).min(1),
});
