import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

const VALID_MOVEMENT_TYPES = [
    "INBOUND",
    "SALE",
    "RETURN",
    "REFUND",
    "ADJUSTMENT",
    "DAMAGE",
    "RESERVED",
    "RELEASED",
] as const;

export async function GET(
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
                        "Only active sellers can view inventory history",
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

        const searchParams =
            request.nextUrl.searchParams;

        const page = Math.max(
            Number(searchParams.get("page")) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                Number(searchParams.get("limit")) || 20,
                1
            ),
            100
        );

        const skip = (page - 1) * limit;

        const type =
            searchParams.get("type");

        const from =
            searchParams.get("from");

        const to =
            searchParams.get("to");

        const where = {
            inventory: {
                listingId: listing.id,
            },

            ...(type &&
                VALID_MOVEMENT_TYPES.includes(
                    type as typeof VALID_MOVEMENT_TYPES[number]
                ) && {
                type:
                    type as typeof VALID_MOVEMENT_TYPES[number],
            }),

            ...(from || to
                ? {
                    createdAt: {
                        ...(from && {
                            gte: new Date(from),
                        }),

                        ...(to && {
                            lte: new Date(to),
                        }),
                    },
                }
                : {}),
        };

        const [
            movements,
            total,
        ] = await prisma.$transaction([
            prisma.inventoryMovement.findMany({
                where,
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit,
                select: {
                    id: true,
                    type: true,
                    quantity: true,
                    quantityBefore: true,
                    quantityAfter: true,
                    referenceType: true,
                    referenceId: true,
                    note: true,
                    createdAt: true,
                },
            }),

            prisma.inventoryMovement.count({
                where,
            }),
        ]);

        const totalPages =
            Math.ceil(total / limit);

        return NextResponse.json({
            success: true,

            data: {
                movements,

                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage:
                        page < totalPages,
                    hasPreviousPage:
                        page > 1,
                },
            },
        });
    } catch (error) {
        console.error(
            "Get inventory movements error:",
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