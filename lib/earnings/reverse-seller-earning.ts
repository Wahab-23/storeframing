import { Prisma } from "@/generated/prisma/client";

import { AppError } from "@/lib/errors";
import { roundMoney } from "@/lib/pricing/rounding";

type ReverseSellerEarningInput = {
    tx: Prisma.TransactionClient;
    sellerOrderId: string;
    sellerId: string;
    amount: number;
    reason: string;
    referenceId: string;
};

export async function reverseSellerEarning({
    tx,
    sellerOrderId,
    sellerId,
    amount,
    reason,
    referenceId,
}: ReverseSellerEarningInput) {
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

    const reversalAmount = Math.min(
        roundMoney(amount),
        roundMoney(Number(earning.netAmount) - Number(earning.refundAmount))
    );

    if (reversalAmount <= 0) {
        return earning;
    }

    if (earning.status === "PENDING") {
        const updated = await tx.sellerEarning.update({
            where: {
                id: earning.id,
            },
            data: {
                refundAmount: {
                    increment: reversalAmount,
                },
                status:
                    roundMoney(
                        Number(earning.refundAmount) + reversalAmount
                    ) >= Number(earning.netAmount)
                        ? "REVERSED"
                        : "PENDING",
            },
        });

        await tx.sellerWallet.update({
            where: {
                sellerId,
            },
            data: {
                pendingBalance: {
                    decrement: reversalAmount,
                },
            },
        });

        return updated;
    }

    const wallet = await tx.sellerWallet.findUnique({
        where: {
            sellerId,
        },
        select: {
            id: true,
            balance: true,
            withdrawableBalance: true,
        },
    });

    if (!wallet) {
        throw new AppError(404, "Seller wallet not found.");
    }

    const updatedWallet = await tx.sellerWallet.update({
        where: {
            id: wallet.id,
        },
        data: {
            balance: {
                decrement: reversalAmount,
            },
            withdrawableBalance: {
                decrement: reversalAmount,
            },
        },
        select: {
            id: true,
            balance: true,
            withdrawableBalance: true,
            pendingBalance: true,
        },
    });

    const updated = await tx.sellerEarning.update({
        where: {
            id: earning.id,
        },
        data: {
            refundAmount: {
                increment: reversalAmount,
            },
            status:
                roundMoney(Number(earning.refundAmount) + reversalAmount) >=
                Number(earning.netAmount)
                    ? "REVERSED"
                    : "AVAILABLE",
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
            type: "REFUND",
            amount: reversalAmount,
            balanceAfter: roundMoney(Number(updatedWallet.balance)),
            referenceType: "REFUND",
            referenceId,
            description: reason,
        },
    });

    return updated;
}

