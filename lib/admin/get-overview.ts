import { prisma } from "@/lib/prisma";

import { adminOverviewSchema } from "@/lib/validators/admin";
import { AppError } from "@/lib/errors";

type GetOverviewInput = {
    userId: string;
    query?: unknown;
};

export async function getAdminOverview({
    userId,
    query = {},
}: GetOverviewInput) {
    const parsed = adminOverviewSchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const [
        totalUsers,
        activeUsers,
        totalSellers,
        pendingSellers,
        activeSellers,
        totalOrders,
        pendingOrders,
        totalProducts,
        activeProducts,
        totalRevenueResult,
        unreadNotifications,
    ] = await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.seller.count(),
        prisma.seller.count({ where: { status: "PENDING" } }),
        prisma.seller.count({ where: { status: "ACTIVE" } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.product.count(),
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.order.aggregate({ _sum: { totalAmount: true } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
        status: 200,
        message: "Admin overview fetched successfully.",
        data: {
            users: {
                total: totalUsers,
                active: activeUsers,
            },
            sellers: {
                total: totalSellers,
                pending: pendingSellers,
                active: activeSellers,
            },
            orders: {
                total: totalOrders,
                pending: pendingOrders,
            },
            products: {
                total: totalProducts,
                active: activeProducts,
            },
            revenue: Number(totalRevenueResult._sum.totalAmount ?? 0),
            unreadNotifications,
        },
    };
}
