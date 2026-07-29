import { z } from "zod";

export const processRefundSchema = z.object({
    returnRequestId: z.string().cuid2(),
    transactionId: z.string().trim().max(191).optional(),
});
