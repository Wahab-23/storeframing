import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "catalogue:listings:read");

    const listings = await prisma.sellerListing.findMany({
        include: {
            product: { select: { name: true, slug: true } },
            seller: { select: { shopName: true } },
        },
        orderBy: { createdAt: "desc" }
    });

    return { data: listings };
});
