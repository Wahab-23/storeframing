import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { error } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

const updateListingSchema = z.object({
    sellerSku: z
        .string()
        .trim()
        .max(100)
        .nullable()
        .optional(),

    price: z
        .number()
        .positive()
        .optional(),

    compareAtPrice: z
        .number()
        .positive()
        .nullable()
        .optional(),

    costPrice: z
        .number()
        .positive()
        .nullable()
        .optional(),

    condition: z
        .enum([
            "NEW",
            "USED",
            "REFURBISHED",
            "OPEN_BOX",
        ])
        .optional(),

    warrantyTitle: z
        .string()
        .trim()
        .max(255)
        .nullable()
        .optional(),

    warrantyDescription: z
        .string()
        .trim()
        .max(5000)
        .nullable()
        .optional(),

    description: z
        .string()
        .trim()
        .max(5000)
        .nullable()
        .optional(),
});

async function getSellerListing(request: NextRequest, id: string) {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new AppError(401, "Unauthorized");
    }

    const seller = await prisma.seller.findUnique({
        where: {
            userId: user.id,
        },
        select: {
            id: true,
            status: true,
        },
    });

    if (!seller) {
        throw new AppError(404, "Seller profile not found");
    }

    if (seller.status !== "ACTIVE") {
        throw new AppError(403, "Only active sellers can manage listings");
    }

    const listing = await prisma.sellerListing.findFirst({
        where: {
            id,
            sellerId: seller.id,
        },
        select: {
            id: true,
            sellerSku: true,
            price: true,
            compareAtPrice: true,
            costPrice: true,
            condition: true,
            warrantyTitle: true,
            warrantyDescription: true,
            description: true,
            status: true,
            rejectionReason: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
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
            inventory: {
                select: {
                    quantity: true,
                    reservedQuantity: true,
                    lowStockThreshold: true,
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
    });

    if (!listing) {
        throw new AppError(404, "Listing not found");
    }

    return { seller, listing } as const;
}

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const result = await getSellerListing(request, id);

    return {
        message: "Listing fetched successfully",
        data: {
            listing: result.listing,
        },
    };
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const result = await getSellerListing(request, id);

    const updatedListing = await prisma.sellerListing.update({
        where: {
            id: result.listing.id,
        },
        data: {
            status: "ARCHIVED",
            deletedAt: new Date(),
        },
    });

    return {
        message: "Listing archived successfully",
        data: {
            listing: updatedListing,
        },
    };
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    try {
        const { id } = await context.params;

        const user = await getCurrentUser(request);

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }

        const seller = await prisma.seller.findUnique({
            where: {
                userId: user.id,
            },
            select: {
                id: true,
                status: true,
            },
        });

        if (!seller) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Seller profile not found",
                },
                { status: 404 }
            );
        }

        if (seller.status !== "ACTIVE") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Only active sellers can update listings",
                },
                { status: 403 }
            );
        }

        const listing =
            await prisma.sellerListing.findFirst({
                where: {
                    id,
                    sellerId: seller.id,
                },
                select: {
                    id: true,
                    price: true,
                    compareAtPrice: true,
                    status: true,
                },
            });

        if (!listing) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Listing not found",
                },
                { status: 404 }
            );
        }

        const body = await request.json();

        const validation =
            updateListingSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    errors:
                        validation.error.flatten()
                            .fieldErrors,
                },
                { status: 400 }
            );
        }

        const data = validation.data;

        const finalPrice =
            data.price ??
            Number(listing.price);

        const finalCompareAtPrice =
            data.compareAtPrice !== undefined
                ? data.compareAtPrice
                : listing.compareAtPrice
                    ? Number(listing.compareAtPrice)
                    : null;

        if (
            finalCompareAtPrice !== null &&
            finalCompareAtPrice <= finalPrice
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Compare-at price must be higher than selling price",
                },
                { status: 400 }
            );
        }

        const updatedListing =
            await prisma.sellerListing.update({
                where: {
                    id: listing.id,
                },
                data: {
                    ...(data.sellerSku !== undefined && {
                        sellerSku: data.sellerSku,
                    }),

                    ...(data.price !== undefined && {
                        price: data.price,
                    }),

                    ...(data.compareAtPrice !== undefined && {
                        compareAtPrice:
                            data.compareAtPrice,
                    }),

                    ...(data.costPrice !== undefined && {
                        costPrice: data.costPrice,
                    }),

                    ...(data.condition !== undefined && {
                        condition: data.condition,
                    }),

                    ...(data.warrantyTitle !== undefined && {
                        warrantyTitle:
                            data.warrantyTitle,
                    }),

                    ...(data.warrantyDescription !== undefined && {
                        warrantyDescription:
                            data.warrantyDescription,
                    }),

                    ...(data.description !== undefined && {
                        description: data.description,
                    }),
                },

                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },

                    inventory: true,
                },
            });

        return NextResponse.json({
            success: true,
            message: "Listing updated successfully",
            data: {
                listing: updatedListing,
            },
        });
    } catch (err) {
        console.error(
            "Update seller listing error:",
            err
        );

        return error("Something went wrong", 500);
    }
});
