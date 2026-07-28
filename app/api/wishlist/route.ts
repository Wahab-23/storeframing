import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getWishlist } from "@/lib/wishlist/get-wishlist";
import { addWishlistItem } from "@/lib/wishlist/add-item";
import { removeWishlistItem } from "@/lib/wishlist/remove-item";
import { clearWishlist } from "@/lib/wishlist/clear-wishlist";
import { addWishlistItemSchema, removeWishlistItemSchema } from "@/lib/validators/wishlist";

export const GET = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    return getWishlist({
        userId: user.id,
    });
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const body = await request.json().catch(() => ({}));
    const validation = addWishlistItemSchema.safeParse(body);

    if (!validation.success) {
        throw new ValidationError("Validation failed");
    }

    return addWishlistItem({
        userId: user.id,
        body: validation.data,
    });
});

export const DELETE = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const body = await request.json().catch(() => ({}));

    if (Object.keys(body).length === 0) {
        return clearWishlist({
            userId: user.id,
        });
    }

    const validation = removeWishlistItemSchema.safeParse(body);

    if (!validation.success) {
        throw new ValidationError("Validation failed");
    }

    return removeWishlistItem({
        userId: user.id,
        body: validation.data,
    });
});
