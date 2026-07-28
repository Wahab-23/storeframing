import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { dateRangeQuerySchema } from "@/lib/validators/reports";

type GetAnalyticsInput = {
    query: unknown;
};

function toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
}

export async function getAnalytics({ query }: GetAnalyticsInput) {
    const parsed = dateRangeQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const now = new Date();
    const from = parsed.data.from ? new Date(parsed.data.from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = parsed.data.to ? new Date(parsed.data.to) : now;

    const orders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: from,
                lte: to,
            },
        },
        select: {
            createdAt: true,
            totalAmount: true,
            status: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    const sellerOrders = await prisma.sellerOrder.findMany({
        where: {
            createdAt: {
                gte: from,
                lte: to,
            },
        },
        select: {
            sellerId: true,
            subtotal: true,
            totalAmount: true,
            createdAt: true,
            seller: {
                select: {
                    id: true,
                    shopName: true,
                    slug: true,
                },
            },
        },
    });

    const byDay = new Map<
        string,
        {
            orders: number;
            revenue: number;
            pendingOrders: number;
            completedOrders: number;
        }
    >();

    for (const order of orders) {
        const key = toDateKey(order.createdAt);
        const current = byDay.get(key) ?? {
            orders: 0,
            revenue: 0,
            pendingOrders: 0,
            completedOrders: 0,
        };

        current.orders += 1;
        current.revenue += Number(order.totalAmount);
        if (order.status === "PENDING") current.pendingOrders += 1;
        if (order.status === "COMPLETED") current.completedOrders += 1;

        byDay.set(key, current);
    }

    const topSellers = new Map<
        string,
        {
            sellerId: string;
            shopName: string;
            slug: string;
            orders: number;
            revenue: number;
        }
    >();

    for (const item of sellerOrders) {
        const existing =
            topSellers.get(item.sellerId) ?? {
                sellerId: item.sellerId,
                shopName: item.seller.shopName,
                slug: item.seller.slug,
                orders: 0,
                revenue: 0,
            };

        existing.orders += 1;
        existing.revenue += Number(item.totalAmount);
        topSellers.set(item.sellerId, existing);
    }

    const daily = Array.from(byDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({
            date,
            ...value,
        }));

    const sellers = Array.from(topSellers.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    return {
        status: 200,
        message: "Analytics fetched successfully.",
        data: {
            range: {
                from,
                to,
            },
            daily,
            topSellers: sellers,
            totals: {
                orders: orders.length,
                revenue: orders.reduce(
                    (total, order) => total + Number(order.totalAmount),
                    0
                ),
                sellerOrders: sellerOrders.length,
            },
        },
    };
}
