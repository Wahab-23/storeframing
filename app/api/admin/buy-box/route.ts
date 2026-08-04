import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "catalogue:buy-box:read");

    // Simplified buy-box computation: getting active listings that are likely winning
    const activeListings = await prisma.sellerListing.findMany({
        where: {
            status: "ACTIVE"
        },
        include: {
            product: { select: { id: true, name: true } },
            seller: { select: { id: true, shopName: true } },
            inventory: { select: { quantity: true } }
        },
        orderBy: { price: "asc" },
        take: 50 // Limit for dashboard view
    });

    return { data: activeListings };
});
