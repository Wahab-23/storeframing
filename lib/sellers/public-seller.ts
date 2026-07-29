import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

type GetPublicSellerInput = {
    sellerIdOrSlug: string;
};

export async function getPublicSellerDetail({
    sellerIdOrSlug,
}: GetPublicSellerInput) {
    const seller = await prisma.seller.findFirst({
        where: {
            OR: [
                { slug: sellerIdOrSlug },
                { id: sellerIdOrSlug },
            ],
        },
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
            seo: true,
            products: {
                where: {
                    status: "ACTIVE",
                    deletedAt: null,
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 20,
                select: {
                    id: true,
                    price: true,
                    compareAtPrice: true,
                    condition: true,
                    description: true,
                    status: true,
                    createdAt: true,
                    inventory: {
                        select: {
                            quantity: true,
                            reservedQuantity: true,
                        },
                    },
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
                    variants: {
                        select: {
                            id: true,
                            price: true,
                            compareAtPrice: true,
                            variant: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                },
                            },
                            inventory: {
                                select: {
                                    quantity: true,
                                    reservedQuantity: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!seller) {
        throw new AppError(404, "Seller not found.");
    }

    return {
        status: 200,
        message: "Seller fetched successfully.",
        data: {
            seller,
        },
    };
}
