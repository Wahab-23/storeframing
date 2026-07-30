import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function settleSellerEarning(
    earningId: string,
    tx?: Prisma.TransactionClient
) {
    const execute = async (db: Prisma.TransactionClient) => {
        const earning = await db.sellerEarning.findUnique({
            where: { id: earningId },
            include: { sellerOrder: true },
        });

        if (!earning) {
            throw new AppError(404, "Seller earning record not found.");
        }

        if (earning.status !== "PENDING") {
            return earning; // Idempotent return if already settled or reversed
        }

        const netAmount = Number(earning.netAmount);

        // Update earning status to AVAILABLE
        const updatedEarning = await db.sellerEarning.update({
            where: { id: earningId },
            data: {
                status: "AVAILABLE",
                availableAt: new Date(),
            },
        });

        // Fetch or initialize SellerWallet
        let wallet = await db.sellerWallet.findUnique({
            where: { sellerId: earning.sellerId },
        });

        if (!wallet) {
            wallet = await db.sellerWallet.create({
                data: {
                    sellerId: earning.sellerId,
                    balance: new Prisma.Decimal(0),
                    pendingBalance: new Prisma.Decimal(0),
                    withdrawableBalance: new Prisma.Decimal(0),
                },
            });
        }

        const newBalance = Number(wallet.balance) + netAmount;
        const newWithdrawable = Number(wallet.withdrawableBalance) + netAmount;
        const newPending = Math.max(0, Number(wallet.pendingBalance) - netAmount);

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
                type: "SALE",
                amount: new Prisma.Decimal(netAmount),
                balanceAfter: new Prisma.Decimal(newBalance),
                referenceType: "SELLER_EARNING",
                referenceId: earning.id,
                description: `Earning settlement for order ${earning.sellerOrder.sellerOrderNumber}`,
            },
        });

        return updatedEarning;
    };

    if (tx) {
        return execute(tx);
    }

    return prisma.$transaction(execute);
}
