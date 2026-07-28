import { Prisma } from "@/generated/prisma/client";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { verifyPaymentSchema } from "@/lib/validators/payment";

type ProcessPaymentInput = {
    body: unknown;
    actorUserId?: string | null;
    source: "CUSTOMER" | "WEBHOOK";
};

function buildUpdateData(
    currentPayment: {
        transactionId: string | null;
        provider: string | null;
        metadata: Prisma.JsonValue | null;
        paidAt: Date | null;
    },
    data: {
        status: "AUTHORIZED" | "PAID" | "FAILED" | "CANCELLED";
        transactionId?: string;
        provider?: string;
        metadata?: Record<string, unknown>;
    }
) {
    const updateData: Prisma.PaymentUpdateInput = {
        status: data.status,
        transactionId: data.transactionId ?? currentPayment.transactionId,
        provider: data.provider ?? currentPayment.provider,
        paidAt:
            data.status === "PAID"
                ? currentPayment.paidAt ?? new Date()
                : currentPayment.paidAt,
    };

    if (data.metadata !== undefined) {
        updateData.metadata = data.metadata as Prisma.InputJsonValue;
    }

    return updateData;
}

export async function processPaymentVerification({
    body,
    actorUserId,
    source,
}: ProcessPaymentInput) {
    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const payment = await prisma.payment.findFirst({
        where: parsed.data.paymentId
            ? {
                  id: parsed.data.paymentId,
              }
            : {
                  orderId: parsed.data.orderId!,
              },
        include: {
            order: {
                include: {
                    payments: true,
                    sellerOrders: true,
                },
            },
        },
    });

    if (!payment) {
        throw new AppError(404, "Payment not found.");
    }

    if (actorUserId && payment.order.userId !== actorUserId) {
        throw new AppError(403, "You cannot verify this payment.");
    }

    if (
        parsed.data.amount != null &&
        Number(payment.amount) !== parsed.data.amount
    ) {
        throw new AppError(409, "Payment amount does not match.");
    }

    if (parsed.data.currency && payment.currency !== parsed.data.currency) {
        throw new AppError(409, "Payment currency does not match.");
    }

    const paymentStatus = parsed.data.status;

    const result = await prisma.$transaction(async (tx) => {
        const currentPayment = await tx.payment.findUnique({
            where: {
                id: payment.id,
            },
            include: {
                order: {
                    include: {
                        sellerOrders: true,
                        payments: true,
                    },
                },
            },
        });

        if (!currentPayment) {
            throw new AppError(404, "Payment not found.");
        }

        if (
            currentPayment.status === paymentStatus &&
            paymentStatus !== "PAID"
        ) {
            return currentPayment;
        }

        if (currentPayment.status === "PAID") {
            return currentPayment;
        }

        const updatedPayment = await tx.payment.update({
            where: {
                id: currentPayment.id,
            },
            data: buildUpdateData(currentPayment, {
                status: paymentStatus,
                transactionId: parsed.data.transactionId,
                provider: parsed.data.provider,
                metadata: parsed.data.metadata,
            }),
            include: {
                order: {
                    include: {
                        sellerOrders: true,
                        payments: true,
                    },
                },
            },
        });

        if (paymentStatus === "PAID") {
            const order = await tx.order.findUnique({
                where: {
                    id: currentPayment.orderId,
                },
                select: {
                    id: true,
                    status: true,
                },
            });

            if (!order) {
                throw new AppError(404, "Order not found.");
            }

            const pendingSellerOrders = await tx.sellerOrder.findMany({
                where: {
                    orderId: order.id,
                    status: "PENDING",
                },
                select: {
                    id: true,
                },
            });

            if (order.status === "PENDING") {
                await tx.order.update({
                    where: {
                        id: order.id,
                    },
                    data: {
                        status: "CONFIRMED",
                    },
                });

                await tx.orderStatusHistory.create({
                    data: {
                        orderId: order.id,
                        fromStatus: order.status,
                        toStatus: "CONFIRMED",
                        source: "PAYMENT",
                        note:
                            source === "WEBHOOK"
                                ? "Payment verified via webhook."
                                : "Payment verified successfully.",
                    },
                });
            }

            await tx.sellerOrder.updateMany({
                where: {
                    orderId: order.id,
                    status: "PENDING",
                },
                data: {
                    status: "CONFIRMED",
                },
            });

            await Promise.all(
                pendingSellerOrders.map((sellerOrder) =>
                    tx.sellerOrderStatusHistory.create({
                        data: {
                            sellerOrderId: sellerOrder.id,
                            fromStatus: "PENDING",
                            toStatus: "CONFIRMED",
                            source: "PAYMENT",
                            note:
                                source === "WEBHOOK"
                                    ? "Payment verified via webhook."
                                    : "Payment verified successfully.",
                        },
                    })
                )
            );
        }

        return updatedPayment;
    });

    return {
        status: 200,
        message:
            source === "WEBHOOK"
                ? "Payment webhook processed successfully."
                : "Payment verified successfully.",
        data: {
            payment: result,
        },
    };
}
