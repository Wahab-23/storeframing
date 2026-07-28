import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { success, error } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

const orderStatusValues = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "PARTIALLY_SHIPPED",
    "SHIPPED",
    "PARTIALLY_DELIVERED",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
    "PARTIALLY_REFUNDED",
    "REFUNDED",
] as const;

const ordersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(orderStatusValues).optional(),
});

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);

        if (!user) {
            return error("Unauthorized", 401);
        }

        const validation = ordersQuerySchema.safeParse({
            page: request.nextUrl.searchParams.get("page") ?? undefined,
            limit: request.nextUrl.searchParams.get("limit") ?? undefined,
            status: request.nextUrl.searchParams.get("status") ?? undefined,
        });

        if (!validation.success) {
            return error(
                "Validation failed",
                400,
                validation.error.flatten().fieldErrors
            );
        }

        const { page, limit, status } = validation.data;
        const where = {
            userId: user.id,
            ...(status ? { status } : {}),
        };

        const [orders, total] = await prisma.$transaction([
            prisma.order.findMany({
                where,
                orderBy: {
                    createdAt: "desc",
                },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    subtotal: true,
                    shippingAmount: true,
                    discountAmount: true,
                    taxAmount: true,
                    totalAmount: true,
                    currency: true,
                    createdAt: true,
                    updatedAt: true,
                    items: {
                        select: {
                            id: true,
                            productName: true,
                            sku: true,
                            quantity: true,
                            unitPrice: true,
                            totalAmount: true,
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    images: {
                                        orderBy: {
                                            sortOrder: "asc",
                                        },
                                        take: 1,
                                        select: {
                                            url: true,
                                            altText: true,
                                        },
                                    },
                                },
                            },
                            listing: {
                                select: {
                                    id: true,
                                },
                            },
                            listingVariant: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                    sellerOrders: {
                        select: {
                            id: true,
                            sellerOrderNumber: true,
                            status: true,
                            subtotal: true,
                            shippingAmount: true,
                            discountAmount: true,
                            taxAmount: true,
                            commissionAmount: true,
                            sellerEarning: true,
                            totalAmount: true,
                            seller: {
                                select: {
                                    id: true,
                                    shopName: true,
                                    slug: true,
                                },
                            },
                        },
                    },
                    payments: {
                        select: {
                            id: true,
                            method: true,
                            status: true,
                            amount: true,
                            provider: true,
                            transactionId: true,
                            paidAt: true,
                        },
                    },
                    shipments: {
                        select: {
                            id: true,
                            status: true,
                            trackingNumber: true,
                            carrier: true,
                            shippedAt: true,
                            deliveredAt: true,
                        },
                    },
                },
            }),
            prisma.order.count({ where }),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / limit));

        return success(
            {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },
            },
            "Orders fetched successfully"
        );
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        console.error(err);
        return error("Something went wrong", 500);
    }
}
