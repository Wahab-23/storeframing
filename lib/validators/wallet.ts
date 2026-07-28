import { z } from "zod";

const walletTransactionTypeValues = [
    "SALE",
    "COMMISSION",
    "REFUND",
    "WITHDRAWAL",
    "ADJUSTMENT",
    "BONUS",
    "PENALTY",
] as const;

export const walletTransactionsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(walletTransactionTypeValues).optional(),
});

export const withdrawWalletSchema = z.object({
    amount: z.number().positive().min(1),
});
