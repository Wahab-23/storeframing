import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, ["admin:products:read", "catalogue:listings:read"]);

    const listings = await prisma.sellerListing.findMany({
        include: {
            product: { select: { name: true, slug: true } },
            seller: { select: { shopName: true } },
            inventory: true,
        },
        orderBy: { createdAt: "desc" }
    });

    return { data: listings };
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const admin = await requirePermission(request, ["admin:products:write", "catalogue:listings:write"]);

    const body = await request.json();
    const {
        sellerId,
        productId,
        price,
        compareAtPrice,
        costPrice,
        sellerSku,
        stock,
        condition = "NEW",
        warrantyTitle,
        warrantyDescription,
        description,
        status = "ACTIVE",
    } = body;

    if (!sellerId || !productId) {
        throw new AppError(400, "Seller store and Product are required.");
    }

    if (price === undefined || price === null || price === "" || Number(price) < 0) {
        throw new AppError(400, "A valid non-negative selling price is required.");
    }

    const listing = await prisma.sellerListing.upsert({
        where: {
            sellerId_productId: {
                sellerId,
                productId,
            }
        },
        create: {
            sellerId,
            productId,
            price: Number(price),
            compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
            costPrice: costPrice ? Number(costPrice) : null,
            sellerSku: sellerSku?.trim() || null,
            condition: condition || "NEW",
            warrantyTitle: warrantyTitle?.trim() || null,
            warrantyDescription: warrantyDescription?.trim() || null,
            description: description?.trim() || null,
            status: status || "ACTIVE",
        },
        update: {
            price: Number(price),
            compareAtPrice: compareAtPrice !== undefined ? (compareAtPrice ? Number(compareAtPrice) : null) : undefined,
            costPrice: costPrice !== undefined ? (costPrice ? Number(costPrice) : null) : undefined,
            sellerSku: sellerSku !== undefined ? (sellerSku?.trim() || null) : undefined,
            condition: condition || undefined,
            warrantyTitle: warrantyTitle !== undefined ? (warrantyTitle?.trim() || null) : undefined,
            warrantyDescription: warrantyDescription !== undefined ? (warrantyDescription?.trim() || null) : undefined,
            description: description !== undefined ? (description?.trim() || null) : undefined,
            status: status || undefined,
        },
        include: {
            seller: true,
            inventory: true,
        }
    });

    if (stock !== undefined && stock !== null && stock !== "") {
        await prisma.inventory.upsert({
            where: { listingId: listing.id },
            create: {
                listingId: listing.id,
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
            entityId: listing.id,
            newData: {
                sellerId,
                productId,
                price: Number(price),
                status: listing.status,
            }
        }
    });

    return {
        data: listing,
        message: "Seller offer saved successfully."
    };
});
