import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";
import {
    createSellerProductRevision,
    listSellerProductRevisions,
} from "@/lib/products/workflow";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
        .enum([
            "DRAFT",
            "PENDING_REVIEW",
            "APPROVED",
            "REJECTED",
            "PUBLISHED",
        ])
        .optional(),
});

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
    const { id: productId } = await context.params;
    const seller = await getSeller(request);

    const parsed = querySchema.safeParse({
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { revisions, total } = await listSellerProductRevisions({
        sellerId: seller.id,
        productId,
        page: parsed.data.page,
        limit: parsed.data.limit,
        status: parsed.data.status,
    });

    return success(
        {
            revisions,
            pagination: {
                page: parsed.data.page,
                limit: parsed.data.limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / parsed.data.limit)),
            },
        },
        "Product revisions fetched successfully"
    );
});

export const POST = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { id: productId } = await context.params;
    const seller = await getSeller(request);
    const body = await request.json().catch(() => ({}));

    try {
        const revision = await createSellerProductRevision({
            sellerId: seller.id,
            productId,
            body,
        });

        return success(revision, "Revision draft created successfully", 201);
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        throw err;
    }
});

