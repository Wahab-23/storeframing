import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";
import {
    updateSellerProductSubmissionDraft,
} from "@/lib/products/workflow";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

async function getSellerSubmission(request: NextRequest, id: string) {
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

    const submission = await prisma.productSubmission.findFirst({
        where: {
            id,
            sellerId: seller.id,
        },
        select: {
            id: true,
            title: true,
            status: true,
            rejectionReason: true,
            submittedAt: true,
            reviewedAt: true,
            createdAt: true,
            updatedAt: true,
            payload: true,
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });

    if (!submission) {
        throw new AppError(404, "Submission not found");
    }

    return { seller, submission } as const;
}

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const result = await getSellerSubmission(request, id);

    return success(
        {
            submission: result.submission,
        },
        "Submission fetched successfully"
    );
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
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
        return error("Only active sellers can edit submissions", 403);
    }

    const body = await request.json().catch(() => ({}));

    try {
        const updated = await updateSellerProductSubmissionDraft({
            sellerId: seller.id,
            submissionId: id,
            body,
        });

        return success(updated, "Submission updated successfully");
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        throw err;
    }
});

