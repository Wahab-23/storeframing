import { Prisma } from "@/generated/prisma/client";

export type WishlistItemWithRelations = Prisma.WishlistItemGetPayload<{
    include: {
        product: {
            select: {
                id: true;
                name: true;
                slug: true;
                images: {
                    orderBy: {
                        sortOrder: "asc";
                    };
                    take: 1;
                    select: {
                        url: true;
                        altText: true;
                    };
                };
            };
        };
        listing: {
            select: {
                id: true;
                sellerSku: true;
                price: true;
                compareAtPrice: true;
                condition: true;
                status: true;
                seller: {
                    select: {
                        id: true;
                        shopName: true;
                        slug: true;
                        trustBadge: true;
                        status: true;
                    };
                };
            };
        };
    };
}>;
