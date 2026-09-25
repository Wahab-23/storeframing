import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await requirePermission(request, "admin:products:write");
    const { id } = await context.params;
    const body = await request.json();

    const { status, price, compareAtPrice, sellerSku, rejectionReason } = body;

    const existing = await prisma.sellerListing.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError(404, "Seller listing not found.");
    }

    const updated = await prisma.sellerListing.update({
        where: { id },
        data: {
            status: status ?? undefined,
            price: price !== undefined ? Number(price) : undefined,
            compareAtPrice: compareAtPrice !== undefined ? (compareAtPrice ? Number(compareAtPrice) : null) : undefined,
            sellerSku: sellerSku !== undefined ? sellerSku : undefined,
            rejectionReason: rejectionReason !== undefined ? rejectionReason : undefined,
        },
        include: {
            seller: true,
            inventory: true,
        }
    });

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: "UPDATE",
            entityType: "SELLER_LISTING",
            entityId: id,
            oldData: { status: existing.status, price: existing.price },
            newData: { status: updated.status, price: updated.price },
        }
    });

    return {
        data: updated,
        message: "Seller offer status updated successfully."
    };
});
