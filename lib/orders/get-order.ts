import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { orderDetailSchema } from "@/lib/validators/orders";

type GetOrderInput = {
    userId: string;
    orderId: string;
};

export async function getCustomerOrderById({
    userId,
    orderId,
}: GetOrderInput) {
    const parsed = orderDetailSchema.safeParse({
        id: orderId,
    });

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const order = await prisma.order.findFirst({
        where: {
            id: parsed.data.id,
            userId,
        },
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
            billingAddress: true,
            shippingAddress: true,
            customerNote: true,
            createdAt: true,
            updatedAt: true,
            items: {
                select: {
                    id: true,
                    productId: true,
                    listingId: true,
                    variantId: true,
                    listingVariantId: true,
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
                            sellerId: true,
                            sellerSku: true,
                            price: true,
                            condition: true,
                        },
                    },
                    listingVariant: {
                        select: {
                            id: true,
                            price: true,
                            compareAtPrice: true,
                            variant: {
                                select: {
                                    id: true,
                                    sku: true,
                                    name: true,
                                },
                            },
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
                    createdAt: true,
                    updatedAt: true,
                    seller: {
                        select: {
                            id: true,
                            shopName: true,
                            slug: true,
                            logoUrl: true,
                        },
                    },
                    items: {
                        select: {
                            id: true,
                            productId: true,
                            listingId: true,
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
                            shippedAt: true,
                            deliveredAt: true,
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
                    currency: true,
                    provider: true,
                    transactionId: true,
                    paidAt: true,
                    metadata: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
            shipments: {
                select: {
                    id: true,
                    status: true,
                    trackingNumber: true,
                    carrier: true,
                    shippingAmount: true,
                    shippedAt: true,
                    deliveredAt: true,
                    createdAt: true,
                    updatedAt: true,
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
            returnRequests: {
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    id: true,
                    status: true,
                    reason: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                    items: {
                        select: {
                            id: true,
                            orderItemId: true,
                            quantity: true,
                        },
                    },
                    refund: {
                        select: {
                            id: true,
                            amount: true,
                            status: true,
                            transactionId: true,
                            processedAt: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                },
            },
            sellerReviews: {
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    id: true,
                    sellerId: true,
                    rating: true,
                    title: true,
                    content: true,
                    status: true,
                    verifiedPurchase: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });

    if (!order) {
        throw new AppError(404, "Order not found.");
    }

    return {
        status: 200,
        message: "Order fetched successfully.",
        data: {
            order,
        },
    };
}
