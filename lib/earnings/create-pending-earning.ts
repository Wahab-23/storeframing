import { Prisma } from "@/generated/prisma/client";
import { roundMoney } from "@/lib/pricing/rounding";

type CreatePendingEarningInput = {
    tx: Prisma.TransactionClient;
    sellerId: string;
    sellerOrderId: string;
    grossAmount: number;
    commissionAmount: number;
};

export async function createPendingEarning({
    tx,
    sellerId,
    sellerOrderId,
    grossAmount,
    commissionAmount,
}: CreatePendingEarningInput) {
    const existing = await tx.sellerEarning.findFirst({
        where: {
            sellerOrderId,
        },
        select: {
            id: true,
        },
    });

    if (existing) {
        return existing;
    }

    return tx.sellerEarning.create({
        data: {
            sellerId,
            sellerOrderId,
            grossAmount: roundMoney(grossAmount),
            commissionAmount: roundMoney(commissionAmount),
            refundAmount: 0,
            netAmount: roundMoney(grossAmount - commissionAmount),
            status: "PENDING",
        },
        select: {
            id: true,
        },
    });
}
