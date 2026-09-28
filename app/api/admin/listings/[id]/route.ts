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
    const admin = await requirePermission(request, ["admin:products:write", "catalogue:listings:write"]);
    const { id } = await context.params;
    const body = await request.json();

    const {
        status,
        price,
        compareAtPrice,
        costPrice,
        sellerSku,
        stock,
        condition,
        warrantyTitle,
        warrantyDescription,
        description,
        rejectionReason,
    } = body;

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
            costPrice: costPrice !== undefined ? (costPrice ? Number(costPrice) : null) : undefined,
            sellerSku: sellerSku !== undefined ? (sellerSku ? sellerSku.trim() : null) : undefined,
            condition: condition ?? undefined,
            warrantyTitle: warrantyTitle !== undefined ? (warrantyTitle ? warrantyTitle.trim() : null) : undefined,
            warrantyDescription: warrantyDescription !== undefined ? (warrantyDescription ? warrantyDescription.trim() : null) : undefined,
            description: description !== undefined ? (description ? description.trim() : null) : undefined,
            rejectionReason: rejectionReason !== undefined ? rejectionReason : undefined,
        },
        include: {
            seller: true,
            inventory: true,
        }
    });

    if (stock !== undefined && stock !== null && stock !== "") {
        await prisma.inventory.upsert({
            where: { listingId: id },
            create: {
                listingId: id,
                quantity: Math.max(0, Math.floor(Number(stock))),
            },
            update: {
                quantity: Math.max(0, Math.floor(Number(stock))),
            }
        });
    }

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
        message: "Seller offer updated successfully."
    };
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await requirePermission(request, ["admin:products:write", "catalogue:listings:write"]);
    const { id } = await context.params;

    const existing = await prisma.sellerListing.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError(404, "Seller listing not found.");
    }

    await prisma.sellerListing.delete({
        where: { id }
    });

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: "DELETE",
            entityType: "SELLER_LISTING",
            entityId: id,
            oldData: { sellerId: existing.sellerId, productId: existing.productId, price: existing.price },
        }
    });

    return {
        message: "Seller offer deleted successfully."
    };
});
