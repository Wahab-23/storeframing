import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { adminSellersQuerySchema } from "@/lib/validators/admin";
import { serializeAdminPagination } from "./dto";

type ListSellersInput = {
    query: unknown;
};

export async function listAdminSellers({ query }: ListSellersInput) {
    const parsed = adminSellersQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, status, verificationStatus, search } = parsed.data;
    const where = {
        ...(status ? { status } : {}),
        ...(verificationStatus ? { verificationStatus } : {}),
        ...(search
            ? {
                  OR: [
                      { shopName: { contains: search, mode: "insensitive" as const } },
                      { slug: { contains: search, mode: "insensitive" as const } },
                      { businessEmail: { contains: search, mode: "insensitive" as const } },
                      { businessPhone: { contains: search, mode: "insensitive" as const } },
                  ],
              }
            : {}),
    };

    const [sellers, total] = await prisma.$transaction([
        prisma.seller.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                shopName: true,
                slug: true,
                status: true,
                verificationStatus: true,
                trustBadge: true,
                completedOrderCount: true,
                positiveReviewCount: true,
                totalSales: true,
                totalOrders: true,
                averageRating: true,
                reviewCount: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                wallet: {
                    select: {
                        balance: true,
                        pendingBalance: true,
                        withdrawableBalance: true,
                    },
                },
            },
        }),
        prisma.seller.count({ where }),
    ]);

    return {
        message: "Sellers fetched successfully.",
        data: {
            sellers,
            pagination: serializeAdminPagination(page, limit, total),
        },
    };
}
