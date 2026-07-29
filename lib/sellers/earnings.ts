import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { sellerEarningsQuerySchema } from "@/lib/validators/seller";
import { getSellerContext } from "@/lib/wallet/get-seller-context";

type SellerEarningsInput = {
    userId: string;
    query: unknown;
};

export async function listSellerEarnings({
    userId,
    query,
}: SellerEarningsInput) {
    const seller = await getSellerContext(userId);
    const parsed = sellerEarningsQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, status } = parsed.data;
    const where = {
        sellerId: seller.id,
        ...(status ? { status } : {}),
    };

    const [earnings, total] = await prisma.$transaction([
        prisma.sellerEarning.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                grossAmount: true,
                commissionAmount: true,
                refundAmount: true,
                netAmount: true,
                status: true,
                availableAt: true,
                paidAt: true,
                createdAt: true,
                sellerOrder: {
                    select: {
                        id: true,
                        sellerOrderNumber: true,
                        order: {
                            select: {
                                id: true,
                                orderNumber: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.sellerEarning.count({ where }),
    ]);

    return {
        status: 200,
        message: "Seller earnings fetched successfully.",
        data: {
            earnings: earnings.map((item) => ({
                ...item,
                grossAmount: Number(item.grossAmount),
                commissionAmount: Number(item.commissionAmount),
                refundAmount: Number(item.refundAmount),
                netAmount: Number(item.netAmount),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        },
    };
}
