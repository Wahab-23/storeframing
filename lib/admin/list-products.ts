import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { adminProductsQuerySchema } from "@/lib/validators/admin";
import { serializeAdminPagination } from "./dto";

type ListProductsInput = {
    query: unknown;
};

export async function listAdminProducts({ query }: ListProductsInput) {
    const parsed = adminProductsQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, status, ownershipType, visibility, search } = parsed.data;
    const where = {
        ...(status ? { status } : {}),
        ...(ownershipType ? { ownershipType } : {}),
        ...(visibility ? { visibility } : {}),
        ...(search
            ? {
                  OR: [
                      { name: { contains: search, mode: "insensitive" as const } },
                      { slug: { contains: search, mode: "insensitive" as const } },
                  ],
              }
            : {}),
    };

    const [products, total] = await prisma.$transaction([
        prisma.product.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                name: true,
                slug: true,
                ownershipType: true,
                productType: true,
                status: true,
                visibility: true,
                createdAt: true,
                updatedAt: true,
                ownerSeller: {
                    select: {
                        id: true,
                        shopName: true,
                        slug: true,
                    },
                },
                brand: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                categories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
                listings: {
                    select: {
                        id: true,
                        sellerId: true,
                        price: true,
                        status: true,
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
        prisma.product.count({ where }),
    ]);

    return {
        message: "Products fetched successfully.",
        data: {
            products,
            pagination: serializeAdminPagination(page, limit, total),
        },
    };
}
