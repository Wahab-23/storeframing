import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { cancelOrderSchema } from "@/lib/validators/orders";

type CancelCustomerOrderInput = {
    userId: string;
    orderId: string;
    body: unknown;
};

const cancellableStatuses = new Set([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
]);

export async function cancelCustomerOrder({
    userId,
    orderId,
    body,
}: CancelCustomerOrderInput) {
    const parsed = cancelOrderSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId,
        },
        select: {
            id: true,
            status: true,
            items: {
                select: {
                    id: true,
                    quantity: true,
                    listingId: true,
                    listingVariantId: true,
                    listing: {
                        select: {
                            inventory: {
                                select: {
                                    id: true,
                                    quantity: true,
                                    reservedQuantity: true,
                                },
                            },
                        },
                    },
                    listingVariant: {
                        select: {
                            inventory: {
                                select: {
                                    id: true,
                                    quantity: true,
                                    reservedQuantity: true,
                                },
                            },
                        },
                    },
                },
            },
            sellerOrders: {
                select: {
                    id: true,
                    status: true,
                },
            },
            payments: {
                select: {
                    id: true,
                    status: true,
                },
            },
        },
    });

    if (!order) {
        throw new AppError(404, "Order not found.");
    }

    if (!cancellableStatuses.has(order.status)) {
        throw new AppError(400, "This order can no longer be cancelled.");
    }

    const paidPayment = order.payments.find((payment) =>
        payment.status === "PAID" || payment.status === "AUTHORIZED"
    );

    if (paidPayment) {
        throw new AppError(
            400,
            "This order has already been paid and must be refunded instead of cancelled."
        );
    }

    const result = await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
            const inventory =
                item.listingVariant?.inventory ?? item.listing.inventory;

            if (!inventory) {
                throw new AppError(
                    400,
                    "Inventory not configured for one or more order items."
                );
            }

            const quantityBefore = inventory.quantity;
            const quantityAfter = quantityBefore + item.quantity;

            await tx.inventory.update({
                where: {
                    id: inventory.id,
                },
                data: {
                    quantity: quantityAfter,
                },
            });

            await tx.inventoryMovement.create({
                data: {
                    inventoryId: inventory.id,
                    type: "RELEASED",
                    quantity: item.quantity,
                    quantityBefore,
                    quantityAfter,
                    referenceType: "ORDER_CANCELLED",
                    referenceId: order.id,
                    note: parsed.data.reason ?? "Customer order cancelled.",
                },
            });
        }

        const updatedOrder = await tx.order.update({
            where: {
                id: order.id,
            },
            data: {
                status: "CANCELLED",
            },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                updatedAt: true,
            },
        });

        await tx.orderStatusHistory.create({
            data: {
                orderId: order.id,
                fromStatus: order.status,
                toStatus: "CANCELLED",
                source: "CUSTOMER",
                note: parsed.data.reason ?? "Customer cancelled the order.",
            },
        });

        await tx.sellerOrder.updateMany({
            where: {
                orderId: order.id,
            },
            data: {
                status: "CANCELLED",
            },
        });

        await Promise.all(
            order.sellerOrders.map((sellerOrder) =>
                tx.sellerOrderStatusHistory.create({
                    data: {
                        sellerOrderId: sellerOrder.id,
                        fromStatus: sellerOrder.status,
                        toStatus: "CANCELLED",
                        source: "CUSTOMER",
                        note:
                            parsed.data.reason ??
                            "Customer cancelled the order.",
                    },
                })
            )
        );

        return updatedOrder;
    });

    return {
        status: 200,
        message: "Order cancelled successfully.",
        data: {
            order: result,
        },
    };
}
