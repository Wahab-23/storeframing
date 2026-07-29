import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import {
    createSellerReview,
    listPublicSellerReviews,
} from "@/lib/reviews/sellers";
import { createSellerReviewSchema } from "@/lib/validators/reviews";

export const GET = withApiHandler(async (request: NextRequest) => {
    const query = {
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        sellerId: request.nextUrl.searchParams.get("sellerId") ?? undefined,
    };

    return listPublicSellerReviews({
        query,
    });
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const body = await request.json().catch(() => ({}));
    const validation = createSellerReviewSchema.safeParse(body);

    if (!validation.success) {
        throw new ValidationError("Validation failed");
    }

    return createSellerReview({
        userId: user.id,
        body: validation.data,
    });
});
