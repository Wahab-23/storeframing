import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";
import {
    createSellerProductSubmissionDraft,
    listSellerProductSubmissions,
} from "@/lib/products/workflow";

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
        .enum([
            "DRAFT",
            "SUBMITTED",
            "PENDING_REVIEW",
            "UNDER_REVIEW",
            "APPROVED",
            "REJECTED",
            "RESUBMITTED",
        ])
        .optional(),
});

export const GET = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        return error("Unauthorized", 401);
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
        return error("Seller profile not found", 404);
    }

    const parsed = querySchema.safeParse({
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { submissions, total } = await listSellerProductSubmissions({
        sellerId: seller.id,
        page: parsed.data.page,
        limit: parsed.data.limit,
        status: parsed.data.status,
    });

    return success(
        {
            submissions,
            pagination: {
                page: parsed.data.page,
                limit: parsed.data.limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / parsed.data.limit)),
            },
        },
        "Product submissions fetched successfully"
    );
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        return error("Unauthorized", 401);
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
        return error("Seller profile not found", 404);
    }

    if (seller.status !== "ACTIVE") {
        return error("Only active sellers can create submissions", 403);
    }

    const body = await request.json().catch(() => ({}));
    const draft = await createSellerProductSubmissionDraft({
        sellerId: seller.id,
        body,
    });

    return success(draft, "Submission draft created successfully", 201);
});

