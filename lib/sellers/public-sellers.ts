import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { publicSellersQuerySchema } from "@/lib/validators/seller";

type PublicSellersInput = {
    query: unknown;
};

export async function listPublicSellers({ query }: PublicSellersInput) {
    const parsed = publicSellersQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, search } = parsed.data;
    const where = {
        status: "ACTIVE" as const,
        ...(search
            ? {
                  OR: [
                      { shopName: { contains: search, mode: "insensitive" as const } },
                      { slug: { contains: search, mode: "insensitive" as const } },
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
                description: true,
                logoUrl: true,
                bannerUrl: true,
                trustBadge: true,
                averageRating: true,
                reviewCount: true,
                totalOrders: true,
                createdAt: true,
                products: {
                    where: {
                        status: "ACTIVE",
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                    },
                    take: 1,
                },
            },
        }),
        prisma.seller.count({ where }),
    ]);

    return {
        status: 200,
        message: "Sellers fetched successfully.",
        data: {
            sellers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        },
    };
}
