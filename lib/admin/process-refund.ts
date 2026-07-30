import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { reverseSellerEarning } from "@/lib/earnings/reverse-seller-earning";

import { processRefundSchema } from "@/lib/validators/refunds";

type ProcessRefundInput = {
    adminId: string;
    returnRequestId: string;
    body: unknown;
};

function roundMoney(value: number) {
    return Math.round(value * 100) / 100;
}

export async function processReturnRefund({
    adminId,
    returnRequestId,
    body,
}: ProcessRefundInput) {
    const parsed = processRefundSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const returnRequest = await prisma.returnRequest.findFirst({
        where: {
            id: returnRequestId,
        },
        select: {
            id: true,
            orderId: true,
            userId: true,
            status: true,
            reason: true,
            description: true,
            order: {
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    items: {
                        select: {
                            id: true,
                            sellerOrderId: true,
                            quantity: true,
                            totalAmount: true,
                            listingId: true,
                            listingVariantId: true,
                            listing: {
                                select: {
                                    inventory: {
                                        select: {
                                            id: true,
                                            quantity: true,
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
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            items: {
                select: {
                    id: true,
                    orderItemId: true,
                    quantity: true,
                    orderItem: {
                        select: {
                            id: true,
                            sellerOrderId: true,
                            quantity: true,
                            totalAmount: true,
                            listingId: true,
                            listingVariantId: true,
                            listing: {
                                select: {
                                    inventory: {
                                        select: {
                                            id: true,
                                            quantity: true,
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
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            refund: {
                select: {
                    id: true,
                    status: true,
                },
            },
        },
    });

    if (!returnRequest) {
        throw new AppError(404, "Return request not found.");
    }

    if (returnRequest.refund?.status === "COMPLETED") {
        throw new AppError(400, "This return request has already been refunded.");
    }

    const refundAmount = roundMoney(
        returnRequest.items.reduce((sum, item) => {
            const orderItem = item.orderItem;
            const unitAmount =
                Number(orderItem.totalAmount) / orderItem.quantity;

            return sum + roundMoney(unitAmount * item.quantity);
        }, 0)
    );

    const result = await prisma.$transaction(async (tx) => {
        for (const item of returnRequest.items) {
            const orderItem = item.orderItem;
            const inventory =
                orderItem.listingVariant?.inventory ??
                orderItem.listing.inventory;

            if (!inventory) {
                throw new AppError(
                    400,
                    "Inventory not configured for one or more return items."
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
                    type: "RETURN",
                    quantity: item.quantity,
                    quantityBefore,
                    quantityAfter,
                    referenceType: "RETURN_REQUEST",
                    referenceId: returnRequest.id,
                    note: "Refund processed by admin.",
                },
            });
        }

        const refund = await tx.refund.upsert({
            where: {
                returnRequestId: returnRequest.id,
            },
            update: {
                amount: refundAmount,
                status: "COMPLETED",
                transactionId: parsed.data.transactionId ?? undefined,
                processedAt: new Date(),
            },
            create: {
                returnRequestId: returnRequest.id,
                amount: refundAmount,
                status: "COMPLETED",
                transactionId: parsed.data.transactionId ?? undefined,
                processedAt: new Date(),
            },
            select: {
                id: true,
                amount: true,
                status: true,
                transactionId: true,
                processedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const orderItems = returnRequest.order.items;
        const returnedByItem = new Map(
            returnRequest.items.map((item) => [item.orderItemId, item.quantity])
        );

        const fullyReturned = orderItems.every((item) => {
            const returnedQuantity = returnedByItem.get(item.id) ?? 0;
            return returnedQuantity >= item.quantity;
        });

        const updatedOrder = await tx.order.update({
            where: {
                id: returnRequest.orderId,
            },
            data: {
                status: fullyReturned ? "REFUNDED" : "PARTIALLY_REFUNDED",
            },
            select: {
                id: true,
                orderNumber: true,
                status: true,
            },
        });

        await tx.orderStatusHistory.create({
            data: {
                orderId: returnRequest.orderId,
                fromStatus: returnRequest.order.status,
                toStatus: fullyReturned
                    ? "REFUNDED"
                    : "PARTIALLY_REFUNDED",
                source: "ADMIN",
                note: "Refund processed by admin.",
            },
        });

        const updatedSellerOrders = await tx.sellerOrder.findMany({
            where: {
                orderId: returnRequest.orderId,
            },
            select: {
                id: true,
                sellerId: true,
                status: true,
                items: {
                    select: {
                        id: true,
                        quantity: true,
                    },
                },
            },
        });

        for (const sellerOrder of updatedSellerOrders) {
            const sellerRefundAmount = roundMoney(
                returnRequest.items
                    .filter(
                        (returnItem) =>
                            returnItem.orderItem.sellerOrderId ===
                            sellerOrder.id
                    )
                    .reduce((sum, returnItem) => {
                        const orderItem = returnItem.orderItem;
                        const unitAmount =
                            Number(orderItem.totalAmount) /
                            orderItem.quantity;

                        return sum + unitAmount * returnItem.quantity;
                    }, 0)
            );

            if (sellerRefundAmount <= 0) {
                continue;
            }

            const sellerOrderFullyReturned =
                sellerOrder.items.every((item) => {
                    const returnedQuantity = returnRequest.items
                        .filter(
                            (returnItem) =>
                                returnItem.orderItem.sellerOrderId ===
                                sellerOrder.id &&
                                returnItem.orderItemId === item.id
                        )
                        .reduce((sum, returnItem) => sum + returnItem.quantity, 0);

                    return returnedQuantity >= item.quantity;
                });

            await tx.sellerOrder.update({
                where: {
                    id: sellerOrder.id,
                },
                data: {
                    status: sellerOrderFullyReturned
                        ? "REFUNDED"
                        : "PARTIALLY_REFUNDED",
                },
            });

            await tx.sellerOrderStatusHistory.create({
                data: {
                    sellerOrderId: sellerOrder.id,
                    fromStatus: sellerOrder.status,
                    toStatus: sellerOrderFullyReturned
                        ? "REFUNDED"
                        : "PARTIALLY_REFUNDED",
                    source: "ADMIN",
                    note: "Refund processed by admin.",
                },
            });

            await reverseSellerEarning({
                tx,
                sellerOrderId: sellerOrder.id,
                sellerId: sellerOrder.sellerId,
                amount: sellerRefundAmount,
                reason: "Refund processed by admin.",
                referenceId: returnRequest.id,
            });
        }

        await tx.payment.updateMany({
            where: {
                orderId: returnRequest.orderId,
                status: {
                    in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"],
                },
            },
            data: {
                status: fullyReturned ? "REFUNDED" : "PARTIALLY_REFUNDED",
            },
        });

        await tx.returnRequest.update({
            where: {
                id: returnRequest.id,
            },
            data: {
                status: "COMPLETED",
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action: "UPDATE",
                entityType: "RETURN_REQUEST",
                entityId: returnRequest.id,
                oldData: {
                    status: returnRequest.status,
                },
                newData: {
                    status: "COMPLETED",
                    amount: refundAmount,
                    transactionId: parsed.data.transactionId ?? null,
                },
            },
        });

        return {
            refund,
            order: updatedOrder,
        };
    });

    return {
        status: 200,
        message: "Refund processed successfully.",
        data: result,
    };
}
