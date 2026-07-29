import { prisma } from "@/lib/prisma";

import { getSellerContext } from "@/lib/wallet/get-seller-context";

type SellerDashboardInput = {
    userId: string;
};

export async function getSellerDashboard({ userId }: SellerDashboardInput) {
    const seller = await getSellerContext(userId);

    const [wallet, stats, recentOrders, recentReviews, recentEarnings] =
        await prisma.$transaction([
            prisma.sellerWallet.upsert({
                where: {
                    sellerId: seller.id,
                },
                update: {},
                create: {
                    sellerId: seller.id,
                },
                select: {
                    id: true,
                    balance: true,
                    pendingBalance: true,
                    withdrawableBalance: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.sellerOrder.aggregate({
                where: {
                    sellerId: seller.id,
                },
                _count: {
                    id: true,
                },
                _sum: {
                    subtotal: true,
                    totalAmount: true,
                    sellerEarning: true,
                    commissionAmount: true,
                },
            }),
            prisma.sellerOrder.findMany({
                where: {
                    sellerId: seller.id,
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 5,
                select: {
                    id: true,
                    sellerOrderNumber: true,
                    status: true,
                    subtotal: true,
                    totalAmount: true,
                    sellerEarning: true,
                    createdAt: true,
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
                },
            }),
            prisma.sellerReview.findMany({
                where: {
                    sellerId: seller.id,
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 5,
                select: {
                    id: true,
                    rating: true,
                    title: true,
                    content: true,
                    status: true,
                    verifiedPurchase: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                        },
                    },
                },
            }),
            prisma.sellerEarning.findMany({
                where: {
                    sellerId: seller.id,
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 5,
                select: {
                    id: true,
                    grossAmount: true,
                    commissionAmount: true,
                    refundAmount: true,
                    netAmount: true,
                    status: true,
                    createdAt: true,
                },
            }),
        ]);

    return {
        status: 200,
        message: "Seller dashboard fetched successfully.",
        data: {
            seller,
            wallet: {
                id: wallet.id,
                balance: Number(wallet.balance),
                pendingBalance: Number(wallet.pendingBalance),
                withdrawableBalance: Number(wallet.withdrawableBalance),
                createdAt: wallet.createdAt,
                updatedAt: wallet.updatedAt,
            },
            stats: {
                totalOrders: stats._count.id,
                subtotal: Number(stats._sum.subtotal ?? 0),
                revenue: Number(stats._sum.totalAmount ?? 0),
                earnings: Number(stats._sum.sellerEarning ?? 0),
                commission: Number(stats._sum.commissionAmount ?? 0),
            },
            recentOrders,
            recentReviews,
            recentEarnings: recentEarnings.map((item) => ({
                ...item,
                grossAmount: Number(item.grossAmount),
                commissionAmount: Number(item.commissionAmount),
                refundAmount: Number(item.refundAmount),
                netAmount: Number(item.netAmount),
            })),
        },
    };
}
