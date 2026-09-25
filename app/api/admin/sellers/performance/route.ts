import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:sellers:read");
    const performance = await prisma.seller.findMany({
        select: {
            id: true,
            shopName: true,
            slug: true,
            logoUrl: true,
            completedOrderCount: true,
            totalSales: true,
            totalOrders: true,
            averageRating: true,
            reviewCount: true,
            trustBadge: true,
            status: true,
            verificationStatus: true,
        },
        orderBy: [
            { completedOrderCount: "desc" },
            { totalSales: "desc" },
        ],
        take: 100
    });
    return { data: performance };
});
