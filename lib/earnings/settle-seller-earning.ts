import { Prisma } from "@/generated/prisma/client";

import { AppError } from "@/lib/errors";
import { roundMoney } from "@/lib/pricing/rounding";

type SettleSellerEarningInput = {
    tx: Prisma.TransactionClient;
    sellerOrderId: string;
    sellerId: string;
};

export async function settleSellerEarning({
    tx,
    sellerOrderId,
    sellerId,
}: SettleSellerEarningInput) {
    const earning = await tx.sellerEarning.findFirst({
        where: {
            sellerOrderId,
            sellerId,
        },
        select: {
            id: true,
            grossAmount: true,
            commissionAmount: true,
            refundAmount: true,
            netAmount: true,
            status: true,
        },
    });

    if (!earning) {
        throw new AppError(404, "Seller earning not found.");
    }

    if (earning.status !== "PENDING") {
        return earning;
    }

    const netAmount = roundMoney(Number(earning.netAmount));

    const wallet = await tx.sellerWallet.upsert({
        where: {
            sellerId,
        },
        update: {},
        create: {
            sellerId,
        },
        select: {
            id: true,
            balance: true,
            pendingBalance: true,
            withdrawableBalance: true,
        },
    });

    const updatedWallet = await tx.sellerWallet.update({
        where: {
            id: wallet.id,
        },
        data: {
            pendingBalance: {
                decrement: netAmount,
            },
            balance: {
                increment: netAmount,
            },
            withdrawableBalance: {
                increment: netAmount,
            },
        },
        select: {
            id: true,
            balance: true,
            pendingBalance: true,
            withdrawableBalance: true,
        },
    });

    const updatedEarning = await tx.sellerEarning.update({
        where: {
            id: earning.id,
        },
        data: {
            status: "AVAILABLE",
            availableAt: new Date(),
        },
        select: {
            id: true,
            grossAmount: true,
            commissionAmount: true,
            refundAmount: true,
            netAmount: true,
            status: true,
            availableAt: true,
            paidAt: true,
        },
    });

    await tx.sellerWalletTransaction.create({
        data: {
            sellerId,
            sellerWalletId: updatedWallet.id,
            type: "SALE",
            amount: netAmount,
            balanceAfter: roundMoney(Number(updatedWallet.balance)),
            referenceType: "EARNING",
            referenceId: earning.id,
            description: "Seller earning released to wallet.",
        },
    });

    return updatedEarning;
}

