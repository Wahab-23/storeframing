import { Prisma } from "@/generated/prisma/client";

export const cartItemInclude =
    {
        product: {
            select: {
                id: true,
                name: true,
                slug: true,

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
            include: {
                seller: {
                    select: {
                        id: true,
                        shopName: true,
                        slug: true,
                        trustBadge: true,
                        status: true,
                    },
                },

                inventory: true,
            },
        },

        listingVariant: {
            include: {
                variant: true,
                inventory: true,
            },
        },
    } satisfies Prisma.CartItemInclude;