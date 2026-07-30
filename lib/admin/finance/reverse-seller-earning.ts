import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export type ReverseSellerEarningInput = {
    sellerOrderId: string;
    refundAmount: number;
    reason?: string;
};

/**
 * Reverses seller earnings and adjusts seller wallet ledgers upon refund processing.
 */
export async function reverseSellerEarning(
    input: ReverseSellerEarningInput,
    tx?: Prisma.TransactionClient
) {
    const execute = async (db: Prisma.TransactionClient) => {
        const earning = await db.sellerEarning.findFirst({
            where: { sellerOrderId: input.sellerOrderId },
            include: { sellerOrder: true },
        });

        if (!earning) {
            return null; // No earning created yet for this order
        }

        const currentRefund = Number(earning.refundAmount);
        const newRefundTotal = currentRefund + input.refundAmount;
        const gross = Number(earning.grossAmount);
        const commission = Number(earning.commissionAmount);

        const newNetEarning = Math.max(0, gross - commission - newRefundTotal);
        const isFullyReversed = newNetEarning === 0;

        const updatedEarning = await db.sellerEarning.update({
            where: { id: earning.id },
            data: {
                refundAmount: new Prisma.Decimal(newRefundTotal),
                netAmount: new Prisma.Decimal(newNetEarning),
                status: isFullyReversed ? "REVERSED" : earning.status,
            },
        });

        const wallet = await db.sellerWallet.findUnique({
            where: { sellerId: earning.sellerId },
        });

        if (wallet) {
            const currentBalance = Number(wallet.balance);
            const currentWithdrawable = Number(wallet.withdrawableBalance);
            const currentPending = Number(wallet.pendingBalance);

            let newBalance = currentBalance;
            let newWithdrawable = currentWithdrawable;
            let newPending = currentPending;

            if (earning.status === "PENDING") {
                newPending = Math.max(0, currentPending - input.refundAmount);
            } else {
                newBalance = Math.max(0, currentBalance - input.refundAmount);
                newWithdrawable = Math.max(0, currentWithdrawable - input.refundAmount);
            }

            await db.sellerWallet.update({
                where: { id: wallet.id },
                data: {
                    balance: new Prisma.Decimal(newBalance),
                    withdrawableBalance: new Prisma.Decimal(newWithdrawable),
                    pendingBalance: new Prisma.Decimal(newPending),
                },
            });

            await db.sellerWalletTransaction.create({
                data: {
                    sellerId: earning.sellerId,
                    sellerWalletId: wallet.id,
                    type: "REFUND",
                    amount: new Prisma.Decimal(input.refundAmount),
                    balanceAfter: new Prisma.Decimal(newBalance),
                    referenceType: "REFUND",
                    referenceId: earning.sellerOrderId,
                    description: input.reason ?? `Refund deduction for order ${earning.sellerOrder.sellerOrderNumber}`,
                },
            });
        }

        return updatedEarning;
    };

    if (tx) {
        return execute(tx);
    }

    return prisma.$transaction(execute);
}
