import { prisma } from "@/lib/prisma";

import { getSellerContext } from "./get-seller-context";
import {
    serializeWallet,
    serializeWalletTransaction,
    serializeWithdrawal,
} from "./dto";

type GetWalletInput = {
    userId: string;
};

export async function getWallet({ userId }: GetWalletInput) {
    const seller = await getSellerContext(userId);

    const wallet = await prisma.sellerWallet.upsert({
        where: {
            sellerId: seller.id,
        },
        update: {},
        create: {
            sellerId: seller.id,
        },
        include: {
            seller: {
                select: {
                    id: true,
                    shopName: true,
                    slug: true,
                    status: true,
                },
            },
        },
    });

    const [transactions, withdrawals] = await Promise.all([
        prisma.sellerWalletTransaction.findMany({
            where: {
                sellerId: seller.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
            select: {
                id: true,
                type: true,
                amount: true,
                balanceAfter: true,
                referenceType: true,
                referenceId: true,
                description: true,
                createdAt: true,
            },
        }),
        prisma.withdrawal.findMany({
            where: {
                sellerId: seller.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
            select: {
                id: true,
                amount: true,
                status: true,
                payoutAccountSnapshot: true,
                transactionReference: true,
                adminNotes: true,
                processedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
    ]);

    return {
        status: 200,
        message: "Wallet fetched successfully.",
        data: {
            wallet: serializeWallet(wallet),
            transactions: transactions.map(serializeWalletTransaction),
            withdrawals: withdrawals.map(serializeWithdrawal),
        },
    };
}
