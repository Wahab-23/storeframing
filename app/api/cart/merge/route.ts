import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { mergeCart } from "@/lib/cart/merge-cart";
import { getCartSession } from "@/lib/cart/getCartSession";
import { mergeCartSchema } from "@/lib/validators/cart";

export const POST = withApiHandler(async (request: NextRequest) => {
    const body = await request.json().catch(() => ({}));
    const validation = mergeCartSchema.safeParse(body);

    if (!validation.success) {
        throw new AppError(400, "Validation failed.");
    }

    const session = await getCartSession(request);

    if (!session.user) {
        throw new AppError(401, "Unauthorized");
    }

    if (!session.guestToken) {
        return {
            data: null,
            message: "No guest cart to merge.",
            status: 200,
        };
    }

    return mergeCart({
        userCartId: session.cart.id,
        guestToken: session.guestToken,
    });
});
