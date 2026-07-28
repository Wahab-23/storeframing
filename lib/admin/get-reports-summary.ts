import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { dateRangeQuerySchema } from "@/lib/validators/reports";

type GetReportsSummaryInput = {
    query: unknown;
};

export async function getReportsSummary({ query }: GetReportsSummaryInput) {
    const parsed = dateRangeQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const now = new Date();
    const from = parsed.data.from ? new Date(parsed.data.from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = parsed.data.to ? new Date(parsed.data.to) : now;

    const [orders, users, sellers, products, withdrawals, earnings, notifications] =
        await prisma.$transaction([
            prisma.order.aggregate({
                where: {
                    createdAt: {
                        gte: from,
                        lte: to,
                    },
                },
                _count: {
                    id: true,
                },
                _sum: {
                    totalAmount: true,
                    subtotal: true,
                    discountAmount: true,
                },
            }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: from,
                        lte: to,
                    },
                },
            }),
            prisma.seller.count({
                where: {
                    createdAt: {
                        gte: from,
                        lte: to,
                    },
                },
            }),
            prisma.product.count({
                where: {
                    createdAt: {
                        gte: from,
                        lte: to,
                    },
                },
            }),
            prisma.withdrawal.aggregate({
                where: {
                    createdAt: {
                        gte: from,
                        lte: to,
                    },
                },
                _count: {
                    id: true,
                },
                _sum: {
                    amount: true,
                },
            }),
            prisma.sellerEarning.aggregate({
                where: {
                    createdAt: {
                        gte: from,
                        lte: to,
                    },
                },
                _count: {
                    id: true,
                },
                _sum: {
                    grossAmount: true,
                    commissionAmount: true,
                    netAmount: true,
                },
            }),
            prisma.notification.count({
                where: {
                    createdAt: {
                        gte: from,
                        lte: to,
                    },
                },
            }),
        ]);

    return {
        status: 200,
        message: "Reports summary fetched successfully.",
        data: {
            range: {
                from,
                to,
            },
            orders: {
                total: orders._count.id,
                revenue: Number(orders._sum.totalAmount ?? 0),
                subtotal: Number(orders._sum.subtotal ?? 0),
                discount: Number(orders._sum.discountAmount ?? 0),
            },
            users,
            sellers,
            products,
            withdrawals: {
                total: withdrawals._count.id,
                amount: Number(withdrawals._sum.amount ?? 0),
            },
            earnings: {
                total: earnings._count.id,
                grossAmount: Number(earnings._sum.grossAmount ?? 0),
                commissionAmount: Number(earnings._sum.commissionAmount ?? 0),
                netAmount: Number(earnings._sum.netAmount ?? 0),
            },
            notifications,
        },
    };
}
