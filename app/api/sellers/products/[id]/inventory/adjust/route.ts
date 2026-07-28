import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

const inventoryAdjustmentSchema = z.object({
    type: z.enum([
        "INBOUND",
        "ADJUSTMENT",
        "DAMAGE",
        "RETURN",
    ]),

    quantity: z
        .number()
        .int()
        .positive(),

    note: z
        .string()
        .trim()
        .max(1000)
        .optional(),
});

export async function POST(
    request: NextRequest,
    context: RouteContext
) {
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
                        "Only active sellers can adjust inventory",
                },
                { status: 403 }
            );
        }

        const listing =
            await prisma.sellerListing.findFirst({
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
            inventoryAdjustmentSchema.safeParse(body);

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

        const inventory =
            await prisma.inventory.findUnique({
                where: {
                    listingId: listing.id,
                },
                select: {
                    id: true,
                    quantity: true,
                    reservedQuantity: true,
                },
            });

        if (!inventory) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Inventory record not found",
                },
                { status: 404 }
            );
        }

        const isStockIncrease =
            data.type === "INBOUND" ||
            data.type === "RETURN";

        const isStockDecrease =
            data.type === "DAMAGE";

        const newQuantity = isStockIncrease
            ? inventory.quantity + data.quantity
            : isStockDecrease
                ? inventory.quantity - data.quantity
                : data.quantity;

        if (
            newQuantity < inventory.reservedQuantity
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Adjustment would reduce stock below reserved quantity",
                },
                { status: 400 }
            );
        }

        if (newQuantity < 0) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Inventory quantity cannot be negative",
                },
                { status: 400 }
            );
        }

        const result =
            await prisma.$transaction(
                async (tx) => {
                    const updatedInventory =
                        await tx.inventory.update({
                            where: {
                                id: inventory.id,
                            },
                            data: {
                                quantity: newQuantity,
                            },
                        });

                    const movement =
                        await tx.inventoryMovement.create({
                            data: {
                                inventoryId:
                                    inventory.id,

                                type: data.type,

                                quantity:
                                    data.quantity,

                                quantityBefore:
                                    inventory.quantity,

                                quantityAfter:
                                    newQuantity,

                                referenceType:
                                    "MANUAL_ADJUSTMENT",

                                referenceId:
                                    listing.id,

                                note: data.note,
                            },
                        });

                    return {
                        inventory:
                            updatedInventory,
                        movement,
                    };
                }
            );

        return NextResponse.json({
            success: true,
            message:
                "Inventory adjusted successfully",
            data: result,
        });
    } catch (error) {
        console.error(
            "Inventory adjustment error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    }
}