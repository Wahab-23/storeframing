import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createProductReview, listProductReviews } from "@/lib/reviews/products";
import { createProductReviewSchema } from "@/lib/validators/reviews";

export const GET = withApiHandler(async (request: NextRequest) => {
    const query = {
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        productId: request.nextUrl.searchParams.get("productId") ?? undefined,
    };

    return listProductReviews({
        query,
    });
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const body = await request.json().catch(() => ({}));
    const validation = createProductReviewSchema.safeParse(body);

    if (!validation.success) {
        throw new ValidationError("Validation failed");
    }

    return createProductReview({
        userId: user.id,
        body: validation.data,
    });
});
