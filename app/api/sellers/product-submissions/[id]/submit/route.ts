import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { submitSellerProductSubmission } from "@/lib/products/workflow";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const POST = withApiHandler(async (request: NextRequest, context: RouteContext) => {
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
        return error("Only active sellers can submit products", 403);
    }

    try {
        const submission = await submitSellerProductSubmission({
            sellerId: seller.id,
            submissionId: id,
        });

        return success(submission, "Submission submitted for review");
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        throw err;
    }
});

