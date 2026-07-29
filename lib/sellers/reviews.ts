import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { sellerReviewsQuerySchema } from "@/lib/validators/seller";
import { getSellerContext } from "@/lib/wallet/get-seller-context";

type SellerReviewsInput = {
    userId: string;
    query: unknown;
};

export async function listSellerReviews({
    userId,
    query,
}: SellerReviewsInput) {
    const seller = await getSellerContext(userId);
    const parsed = sellerReviewsQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, status } = parsed.data;
    const where = {
        sellerId: seller.id,
        ...(status ? { status } : {}),
    };

    const [reviews, total] = await prisma.$transaction([
        prisma.sellerReview.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                rating: true,
                title: true,
                content: true,
                status: true,
                verifiedPurchase: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                    },
                },
            },
        }),
        prisma.sellerReview.count({ where }),
    ]);

    return {
        status: 200,
        message: "Seller reviews fetched successfully.",
        data: {
            reviews,
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
