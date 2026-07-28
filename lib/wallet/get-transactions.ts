import { prisma } from "@/lib/prisma";

import { getSellerContext } from "./get-seller-context";
import { serializeWalletTransaction } from "./dto";
import { walletTransactionsQuerySchema } from "@/lib/validators/wallet";
import { AppError } from "@/lib/errors";

type GetTransactionsInput = {
    userId: string;
    query: unknown;
};

export async function getWalletTransactions({
    userId,
    query,
}: GetTransactionsInput) {
    const seller = await getSellerContext(userId);
    const parsed = walletTransactionsQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, type } = parsed.data;
    const where = {
        sellerId: seller.id,
        ...(type ? { type } : {}),
    };

    const [transactions, total] = await prisma.$transaction([
        prisma.sellerWalletTransaction.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
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
        prisma.sellerWalletTransaction.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
        status: 200,
        message: "Wallet transactions fetched successfully.",
        data: {
            transactions: transactions.map(serializeWalletTransaction),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        },
    };
}
