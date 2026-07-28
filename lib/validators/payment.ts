import { z } from "zod";

const paymentVerificationStatusValues = [
    "AUTHORIZED",
    "PAID",
    "FAILED",
    "CANCELLED",
] as const;

export const verifyPaymentSchema = z
    .object({
        paymentId: z.string().cuid2().optional(),
        orderId: z.string().cuid2().optional(),
        transactionId: z.string().trim().min(1).max(191).optional(),
        provider: z.string().trim().max(100).optional(),
        status: z.enum(paymentVerificationStatusValues),
        amount: z.number().positive().optional(),
        currency: z.string().trim().length(3).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .refine((data) => Boolean(data.paymentId || data.orderId), {
        message: "paymentId or orderId is required.",
        path: ["paymentId"],
    });
