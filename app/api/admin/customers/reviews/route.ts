import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "customers:reviews:read");

    const reviews = await prisma.productReview.findMany({
        include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            product: { select: { name: true, slug: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return { data: reviews };
});

export const DELETE = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "customers:reviews:write");
    
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) throw new AppError(400, "Review ID is required");

    await prisma.productReview.delete({
        where: { id }
    });

    return { message: "Review deleted successfully" };
});
