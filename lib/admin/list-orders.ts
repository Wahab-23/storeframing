import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { adminOrdersQuerySchema } from "@/lib/validators/admin";
import { serializeAdminPagination } from "./dto";

type ListOrdersInput = {
    query: unknown;
};

export async function listAdminOrders({ query }: ListOrdersInput) {
    const parsed = adminOrdersQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, status, search } = parsed.data;
    const where = {
        ...(status ? { status } : {}),
        ...(search
            ? {
                  OR: [
                      { orderNumber: { contains: search, mode: "insensitive" as const } },
                      { user: { email: { contains: search, mode: "insensitive" as const } } },
                  ],
              }
            : {}),
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
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
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
                sellerOrders: {
                    select: {
                        id: true,
                        sellerOrderNumber: true,
                        status: true,
                        subtotal: true,
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
            },
        }),
        prisma.order.count({ where }),
    ]);

    return {
        status: 200,
        message: "Orders fetched successfully.",
        data: {
            orders,
            pagination: serializeAdminPagination(page, limit, total),
        },
    };
}
