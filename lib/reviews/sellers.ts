import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import {
    createSellerReviewSchema,
    sellerReviewsQuerySchema,
} from "@/lib/validators/reviews";

type ListSellerReviewsInput = {
    query: unknown;
};

type CreateSellerReviewInput = {
    userId: string;
    body: unknown;
};

export async function listPublicSellerReviews({
    query,
}: ListSellerReviewsInput) {
    const parsed = sellerReviewsQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, sellerId } = parsed.data;
    const where = {
        status: "APPROVED" as const,
        ...(sellerId ? { sellerId } : {}),
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
                seller: {
                    select: {
                        id: true,
                        shopName: true,
                        slug: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
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

export async function createSellerReview({
    userId,
    body,
}: CreateSellerReviewInput) {
    const parsed = createSellerReviewSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { sellerId, orderId, rating, title, content } = parsed.data;

    const order = orderId
        ? await prisma.order.findFirst({
              where: {
                  id: orderId,
                  userId,
                  sellerOrders: {
                      some: {
                          sellerId,
                      },
                  },
              },
              select: {
                  id: true,
              },
          })
        : null;

    if (orderId && !order) {
        throw new AppError(404, "Verified seller purchase not found.");
    }

    const existingReview = await prisma.sellerReview.findFirst({
        where: {
            userId,
            sellerId,
            ...(orderId ? { orderId } : {}),
        },
        select: {
            id: true,
        },
    });

    if (existingReview) {
        throw new AppError(409, "You have already reviewed this seller.");
    }

    const review = await prisma.sellerReview.create({
        data: {
            userId,
            sellerId,
            orderId: order?.id ?? null,
            rating,
            title: title ?? null,
            content: content ?? null,
            status: "PENDING",
            verifiedPurchase: Boolean(order),
        },
        select: {
            id: true,
            rating: true,
            title: true,
            content: true,
            status: true,
            verifiedPurchase: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return {
        status: 201,
        message: "Seller review submitted successfully.",
        data: {
            review,
        },
    };
}
