import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateSellerEarningInput = {
    sellerId: string;
    sellerOrderId: string;
    grossAmount: number;
    commissionAmount: number;
    holdingDays?: number;
};

/**
 * Idempotently creates a SellerEarning record for a completed seller order.
 */
export async function createSellerEarning(
    input: CreateSellerEarningInput,
    tx?: Prisma.TransactionClient
) {
    const db = tx ?? prisma;

    const existingEarning = await db.sellerEarning.findFirst({
        where: {
            sellerOrderId: input.sellerOrderId,
        },
    });

    if (existingEarning) {
        return existingEarning;
    }

    const netAmount = Math.max(0, input.grossAmount - input.commissionAmount);
    const holdingDays = input.holdingDays ?? 7;
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + holdingDays);

    return db.sellerEarning.create({
        data: {
            sellerId: input.sellerId,
            sellerOrderId: input.sellerOrderId,
            grossAmount: new Prisma.Decimal(input.grossAmount),
            commissionAmount: new Prisma.Decimal(input.commissionAmount),
            refundAmount: new Prisma.Decimal(0),
            netAmount: new Prisma.Decimal(netAmount),
            status: "PENDING",
            availableAt,
        },
    });
}
