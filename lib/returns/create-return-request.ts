import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { createReturnRequestSchema } from "@/lib/validators/returns";

type CreateReturnRequestInput = {
    userId: string;
    body: unknown;
};

export async function createReturnRequest({
    userId,
    body,
}: CreateReturnRequestInput) {
    const parsed = createReturnRequestSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { orderId, reason, description, items } = parsed.data;

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
                    totalAmount: true,
                },
            },
        },
    });

    if (!order) {
        throw new AppError(404, "Order not found.");
    }

    if (!["DELIVERED", "COMPLETED", "PARTIALLY_DELIVERED"].includes(order.status)) {
        throw new AppError(
            400,
            "Returns are only available for delivered or completed orders."
        );
    }

    const itemQuantityMap = new Map(order.items.map((item) => [item.id, item.quantity]));

    for (const item of items) {
        const quantity = itemQuantityMap.get(item.orderItemId);

        if (!quantity) {
            throw new AppError(404, "One or more return items were not found.");
        }

        if (item.quantity > quantity) {
            throw new AppError(
                400,
                "Return quantity cannot exceed the purchased quantity."
            );
        }
    }

    const returnRequest = await prisma.$transaction(async (tx) => {
        const created = await tx.returnRequest.create({
            data: {
                orderId: order.id,
                userId,
                reason,
                description: description ?? null,
                items: {
                    create: items.map((item) => ({
                        orderItemId: item.orderItemId,
                        quantity: item.quantity,
                    })),
                },
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
            },
        });

        return created;
    });

    return {
        status: 201,
        message: "Return request created successfully.",
        data: {
            returnRequest,
        },
    };
}
