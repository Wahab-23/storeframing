import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        const seller = await prisma.seller.findFirst({
            where: {
                OR: [
                    { slug: id },
                    { id },
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
            return NextResponse.json(
                {
                    success: false,
                    message: "Seller not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                seller,
            },
        });
    } catch (error) {
        console.error("Get public seller error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    }
}