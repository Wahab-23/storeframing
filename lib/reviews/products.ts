import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import {
    createProductReviewSchema,
    productReviewsQuerySchema,
} from "@/lib/validators/reviews";

type ListProductReviewsInput = {
    query: unknown;
};

type CreateProductReviewInput = {
    userId: string;
    body: unknown;
};

export async function listProductReviews({
    query,
}: ListProductReviewsInput) {
    const parsed = productReviewsQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, productId } = parsed.data;
    const where = {
        status: "APPROVED" as const,
        ...(productId ? { productId } : {}),
    };

    const [reviews, total] = await prisma.$transaction([
        prisma.productReview.findMany({
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
                product: {
                    select: {
                        id: true,
                        name: true,
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
        prisma.productReview.count({ where }),
    ]);

    return {
        status: 200,
        message: "Product reviews fetched successfully.",
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

export async function createProductReview({
    userId,
    body,
}: CreateProductReviewInput) {
    const parsed = createProductReviewSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { productId, orderItemId, rating, title, content } = parsed.data;

    const orderItem = orderItemId
        ? await prisma.orderItem.findFirst({
              where: {
                  id: orderItemId,
                  productId,
                  order: {
                      userId,
                  },
              },
              select: {
                  id: true,
                  orderId: true,
              },
          })
        : null;

    if (orderItemId && !orderItem) {
        throw new AppError(404, "Verified purchase not found.");
    }

    const existingReview = await prisma.productReview.findFirst({
        where: {
            userId,
            productId,
            ...(orderItemId ? { orderItemId } : {}),
        },
        select: {
            id: true,
        },
    });

    if (existingReview) {
        throw new AppError(
            409,
            "You have already reviewed this product."
        );
    }

    const review = await prisma.productReview.create({
        data: {
            userId,
            productId,
            orderItemId: orderItem?.id ?? null,
            rating,
            title: title ?? null,
            content: content ?? null,
            status: "PENDING",
            verifiedPurchase: Boolean(orderItem),
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
        message: "Product review submitted successfully.",
        data: {
            review,
        },
    };
}
