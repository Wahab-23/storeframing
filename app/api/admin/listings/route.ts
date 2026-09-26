import { NextRequest, NextResponse } from "next/server";
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

export const POST = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "catalogue:listings:write");

    const body = await request.json();
    const { sellerId, productId, price, stock, condition } = body;

    if (!sellerId || !productId || !price) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const listing = await prisma.sellerListing.create({
        data: {
            sellerId,
            productId,
            price: Number(price),
            condition: condition || "NEW",
            status: "APPROVED",
        }
    });

    if (stock) {
        await prisma.inventory.create({
            data: {
                listingId: listing.id,
                quantity: Number(stock)
            }
        });
    }

    return { data: listing };
});
