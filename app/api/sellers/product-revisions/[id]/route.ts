import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { updateSellerProductRevision } from "@/lib/products/workflow";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

async function getSeller(request: NextRequest) {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new AppError(401, "Unauthorized");
    }

    const seller = await prisma.seller.findUnique({
        where: {
            userId: user.id,
        },
        select: {
            id: true,
            status: true,
        },
    });

    if (!seller) {
        throw new AppError(404, "Seller profile not found");
    }

    if (seller.status !== "ACTIVE") {
        throw new AppError(403, "Only active sellers can manage revisions");
    }

    return seller;
}

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const seller = await getSeller(request);

    const revision = await prisma.productRevision.findFirst({
        where: {
            id,
            product: {
                ownerSellerId: seller.id,
                ownershipType: "SELLER_EXCLUSIVE",
            },
        },
        select: {
            id: true,
            revisionNumber: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            reviewedAt: true,
            publishedAt: true,
            rejectedReason: true,
            payload: true,
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true,
                    visibility: true,
                },
            },
        },
    });

    if (!revision) {
        return error("Revision not found", 404);
    }

    return success({ revision }, "Revision fetched successfully");
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const seller = await getSeller(request);
    const body = await request.json().catch(() => ({}));

    try {
        const revision = await updateSellerProductRevision({
            sellerId: seller.id,
            revisionId: id,
            body,
        });

        return success(revision, "Revision updated successfully");
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        throw err;
    }
});

