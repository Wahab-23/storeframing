import { AppError } from "@/lib/errors";
import { settleSellerEarning } from "@/lib/earnings/settle-seller-earning";
import { prisma } from "@/lib/prisma";

import { sellerOrdersQuerySchema, sellerOrderStatusSchema } from "@/lib/validators/seller";
import { getSellerContext } from "@/lib/wallet/get-seller-context";

type SellerOrdersInput = {
    userId: string;
    query: unknown;
};

export async function listSellerOrders({
    userId,
    query,
}: SellerOrdersInput) {
    const seller = await getSellerContext(userId);
    const parsed = sellerOrdersQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, status, search } = parsed.data;
    const where = {
        sellerId: seller.id,
        ...(status ? { status } : {}),
        ...(search
            ? {
                  OR: [
                      { sellerOrderNumber: { contains: search, mode: "insensitive" as const } },
                      { order: { orderNumber: { contains: search, mode: "insensitive" as const } } },
                  ],
              }
            : {}),
    };

    const [sellerOrders, total] = await prisma.$transaction([
        prisma.sellerOrder.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
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
                createdAt: true,
                updatedAt: true,
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                items: {
                    select: {
                        id: true,
                        productName: true,
                        sku: true,
                        quantity: true,
                        unitPrice: true,
                        totalAmount: true,
                    },
                },
                shipments: {
                    select: {
                        id: true,
                        status: true,
                        trackingNumber: true,
                        carrier: true,
                    },
                },
            },
        }),
        prisma.sellerOrder.count({ where }),
    ]);

    return {
        status: 200,
        message: "Seller orders fetched successfully.",
        data: {
            sellerOrders,
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

export async function getSellerOrderById(userId: string, sellerOrderId: string) {
    const seller = await getSellerContext(userId);

    const sellerOrder = await prisma.sellerOrder.findFirst({
        where: {
            id: sellerOrderId,
            sellerId: seller.id,
        },
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
            createdAt: true,
            updatedAt: true,
            order: {
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
            items: {
                select: {
                    id: true,
                    productName: true,
                    sku: true,
                    quantity: true,
                    unitPrice: true,
                    discountAmount: true,
                    taxAmount: true,
                    totalAmount: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
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
            statusHistory: {
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    id: true,
                    fromStatus: true,
                    toStatus: true,
                    source: true,
                    note: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!sellerOrder) {
        throw new AppError(404, "Seller order not found.");
    }

    return {
        status: 200,
        message: "Seller order fetched successfully.",
        data: {
            sellerOrder,
        },
    };
}

export async function updateSellerOrderStatus(
    userId: string,
    sellerOrderId: string,
    body: unknown
) {
    const seller = await getSellerContext(userId);
    const parsed = sellerOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const sellerOrder = await prisma.sellerOrder.findFirst({
        where: {
            id: sellerOrderId,
            sellerId: seller.id,
        },
        select: {
            id: true,
            orderId: true,
            status: true,
        },
    });

    if (!sellerOrder) {
        throw new AppError(404, "Seller order not found.");
    }

    if (sellerOrder.status === parsed.data.status) {
        return {
            status: 200,
            message: "Seller order status is already up to date.",
            data: {
                sellerOrder,
            },
        };
    }

    const updated = await prisma.$transaction(async (tx) => {
        const updatedSellerOrder = await tx.sellerOrder.update({
            where: {
                id: sellerOrder.id,
            },
            data: {
                status: parsed.data.status,
            },
            select: {
                id: true,
                orderId: true,
                status: true,
            },
        });

        await tx.sellerOrderStatusHistory.create({
            data: {
                sellerOrderId: sellerOrder.id,
                fromStatus: sellerOrder.status,
                toStatus: parsed.data.status,
                source: "SYSTEM",
                note: "Updated by seller.",
            },
        });

        if (parsed.data.status === "COMPLETED") {
            await settleSellerEarning({
                tx,
                sellerOrderId: sellerOrder.id,
                sellerId: seller.id,
            });
        }

        const siblingOrders = await tx.sellerOrder.findMany({
            where: {
                orderId: sellerOrder.orderId,
            },
            select: {
                status: true,
            },
        });

        const allCompleted = siblingOrders.every((item) => item.status === "COMPLETED");
        const allDelivered = siblingOrders.every((item) => item.status === "DELIVERED");
        const allShipped = siblingOrders.every((item) => item.status === "SHIPPED");

        if (allCompleted || allDelivered || allShipped) {
            await tx.order.update({
                where: {
                    id: sellerOrder.orderId,
                },
                data: {
                    status: allCompleted
                        ? "COMPLETED"
                        : allDelivered
                            ? "DELIVERED"
                            : "SHIPPED",
                },
            });
        }

        return updatedSellerOrder;
    });

    return {
        status: 200,
        message: "Seller order status updated successfully.",
        data: {
            sellerOrder: updated,
        },
    };
}
