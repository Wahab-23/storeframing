import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { success, error } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

const updateInventorySchema = z.object({
    quantity: z
        .number()
        .int()
        .min(0),

    lowStockThreshold: z
        .number()
        .int()
        .min(0)
        .optional(),
});

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

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
            return error("Only active sellers can view inventory", 403);
        }

        const listing = await prisma.sellerListing.findFirst({
            where: {
                id,
                sellerId: seller.id,
                deletedAt: null,
            },
            select: {
                id: true,
            },
        });

        if (!listing) {
            return error("Listing not found", 404);
        }

        const inventory = await prisma.inventory.findUnique({
            where: {
                listingId: listing.id,
            },
            select: {
                id: true,
                quantity: true,
                reservedQuantity: true,
                lowStockThreshold: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!inventory) {
            return error("Inventory record not found", 404);
        }

        return success(
            {
                inventory,
                availableQuantity: Math.max(
                    inventory.quantity - inventory.reservedQuantity,
                    0
                ),
            },
            "Inventory fetched successfully"
        );
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        console.error(err);
        return error("Something went wrong", 500);
    }
}

export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

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
            return error("Only active sellers can update inventory", 403);
        }

        const listing =
            await prisma.sellerListing.findFirst({
                where: {
                    id,
                    sellerId: seller.id,
                },
                select: {
                    id: true,
                },
            });

        if (!listing) {
            return error("Listing not found", 404);
        }

        const body = await request.json();

        const validation =
            updateInventorySchema.safeParse(body);

        if (!validation.success) {
            return error(
                "Validation failed",
                400,
                validation.error.flatten().fieldErrors
            );
        }

        const data = validation.data;

        const inventory =
            await prisma.inventory.findUnique({
                where: {
                    listingId: listing.id,
                },
                select: {
                    id: true,
                    quantity: true,
                    reservedQuantity: true,
                    lowStockThreshold: true,
                },
            });

        if (!inventory) {
            return error("Inventory record not found", 404);
        }

        if (
            data.quantity <
            inventory.reservedQuantity
        ) {
            return error(
                "Quantity cannot be lower than reserved quantity",
                400
            );
        }

        const updatedInventory =
            await prisma.inventory.update({
                where: {
                    id: inventory.id,
                },
                data: {
                    quantity: data.quantity,

                    ...(data.lowStockThreshold !== undefined && {
                        lowStockThreshold:
                            data.lowStockThreshold,
                    }),
                },
            });

        return NextResponse.json({
            success: true,
            message: "Inventory updated successfully",
            data: {
                inventory: updatedInventory,
            },
        });
    } catch (err) {
        console.error(
            "Update inventory error:",
            err
        );

        return error("Something went wrong", 500);
    }
}
