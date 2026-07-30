import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { success, error } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { assertSellerCanCreateListing } from "@/lib/products/ownership";

const createListingSchema = z.object({
    productId: z.string().min(1),

    sellerSku: z
        .string()
        .trim()
        .max(100)
        .optional(),

    price: z
        .number()
        .positive(),

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

    quantity: z
        .number()
        .int()
        .min(0)
        .default(0),

    lowStockThreshold: z
        .number()
        .int()
        .min(0)
        .default(5),
});

const listingsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
        .enum([
            "DRAFT",
            "PENDING_REVIEW",
            "ACTIVE",
            "INACTIVE",
            "REJECTED",
            "ARCHIVED",
        ])
        .optional(),
});

export const GET = withApiHandler(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser(request);

        if (!user) {
            return error("Unauthorized", 401);
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
            return error("Seller profile not found", 404);
        }

        const validation = listingsQuerySchema.safeParse({
            page: request.nextUrl.searchParams.get("page") ?? undefined,
            limit: request.nextUrl.searchParams.get("limit") ?? undefined,
            status: request.nextUrl.searchParams.get("status") ?? undefined,
        });

        if (!validation.success) {
            return error(
                "Validation failed",
                400,
                validation.error.flatten().fieldErrors
            );
        }

        const { page, limit, status } = validation.data;

        const where = {
            sellerId: seller.id,
            deletedAt: null,
            ...(status ? { status } : {}),
        };

        const [listings, total] = await prisma.$transaction([
            prisma.sellerListing.findMany({
                where,
                orderBy: {
                    createdAt: "desc",
                },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    sellerSku: true,
                    price: true,
                    compareAtPrice: true,
                    costPrice: true,
                    condition: true,
                    status: true,
                    rejectionReason: true,
                    createdAt: true,
                    updatedAt: true,
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
            }),
            prisma.sellerListing.count({ where }),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / limit));

        return success(
            {
                listings,
                seller: {
                    id: seller.id,
                    status: seller.status,
                },
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },
            },
            "Seller listings fetched successfully"
        );
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        console.error(err);
        return error("Something went wrong", 500);
    }
});

export const POST = withApiHandler(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser(request);

        if (!user) {
            return error("Unauthorized", 401);
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
            return error("Seller profile not found", 404);
        }

        if (seller.status !== "ACTIVE") {
            return error("Only active sellers can create listings", 403);
        }

        const body = await request.json();

        const validation =
            createListingSchema.safeParse(body);

        if (!validation.success) {
            return error(
                "Validation failed",
                400,
                validation.error.flatten().fieldErrors
            );
        }

        const data = validation.data;

        const product = await prisma.product.findFirst({
            where: {
                id: data.productId,
                status: "ACTIVE",
                visibility: "VISIBLE",
                deletedAt: null,
            },
            select: {
                id: true,
                ownershipType: true,
                ownerSellerId: true,
                productType: true,
            },
        });

        if (!product) {
            return error("Product not found or unavailable", 404);
        }

        try {
            assertSellerCanCreateListing(product, seller.id);
        } catch (ownershipError) {
            if (ownershipError instanceof AppError) {
                return error(ownershipError.message, ownershipError.status);
            }

            throw ownershipError;
        }

        const existingListing =
            await prisma.sellerListing.findUnique({
                where: {
                    sellerId_productId: {
                        sellerId: seller.id,
                        productId: data.productId,
                    },
                },
                select: {
                    id: true,
                    status: true,
                },
            });

        if (existingListing) {
            return error("You already have a listing for this product", 409, {
                listingId: existingListing.id,
            });
        }

        if (
            data.compareAtPrice !== null &&
            data.compareAtPrice !== undefined &&
            data.compareAtPrice <= data.price
        ) {
            return error("Compare-at price must be higher than selling price", 400);
        }

        const listing = await prisma.$transaction(
            async (tx) => {
                const createdListing =
                    await tx.sellerListing.create({
                        data: {
                            sellerId: seller.id,
                            productId: data.productId,

                            sellerSku:
                                data.sellerSku,

                            price: data.price,

                            compareAtPrice:
                                data.compareAtPrice,

                            costPrice:
                                data.costPrice,

                            condition:
                                data.condition ?? "NEW",

                            warrantyTitle:
                                data.warrantyTitle,

                            warrantyDescription:
                                data.warrantyDescription,

                            description:
                                data.description,

                            status: "PENDING_REVIEW",

                            inventory: {
                                create: {
                                    quantity:
                                        data.quantity,

                                    lowStockThreshold:
                                        data.lowStockThreshold,
                                },
                            },
                        },

                        include: {
                            inventory: true,

                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                },
                            },
                        },
                    });

                return createdListing;
            }
        );

        return success(
            {
                listing,
            },
            "Product listing created and submitted for review",
            201
        );
    } catch (err) {
        console.error(
            "Create seller listing error:",
            err
        );

        return error("Something went wrong", 500);
    }
});
