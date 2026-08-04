import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "sellers:performance:read");
    const performance = await prisma.seller.findMany({
        select: { id: true, shopName: true, completedOrderCount: true },
        orderBy: { completedOrderCount: "desc" },
        take: 100
    });
    return { data: performance };
});
