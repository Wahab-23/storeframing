import { Prisma } from "@/generated/prisma/client";

export const couponCartItemInclude =
    {
        product: {
            select: {
                id: true,
                name: true,
                slug: true,
                categories: {
                    select: {
                        categoryId: true,
                    },
                },
                images: {
                    orderBy: {
                        sortOrder: "asc",
                    },
                    take: 1,
                    select: {
                        url: true,
                        altText: true,
                    },
                },
            },
        },

        listing: {
            select: {
                id: true,
                sellerId: true,
                sellerSku: true,
                compareAtPrice: true,
                condition: true,
                inventory: true,
                seller: {
                    select: {
                        id: true,
                        shopName: true,
                        slug: true,
                        trustBadge: true,
                        status: true,
                    },
                },
            },
        },

        listingVariant: {
            include: {
                variant: true,
                inventory: true,
            },
        },
    } satisfies Prisma.CartItemInclude;

export const couponWithRelationsInclude =
    {
        products: {
            select: {
                productId: true,
            },
        },

        categories: {
            select: {
                categoryId: true,
            },
        },
    } satisfies Prisma.CouponInclude;
