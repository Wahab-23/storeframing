import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "catalogue:inventory:read");

    const inventory = await prisma.inventory.findMany({
        include: {
            listing: {
                select: {
                    product: { select: { name: true } },
                    seller: { select: { shopName: true } },
                }
            },
            listingVariant: {
                select: {
                    id: true,

                }
            }
        },
        orderBy: { updatedAt: "desc" }
    });

    return { data: inventory };
});

export const POST = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "catalogue:inventory:write");

    const body = await request.json();

    const inventory = await prisma.inventory.create({
        data: {
            listingId: body.sellerListingId,
            listingVariantId: body.sellerListingVariantId,
            quantity: body.quantity,
            lowStockThreshold: body.lowStockThreshold,
        }
    });

    return { data: inventory, status: 201 };
});
