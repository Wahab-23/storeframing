import { NextRequest } from "next/server";

import { success, error } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { mergeCart } from "@/lib/cart/merge-cart";
import { getCartSession } from "@/lib/cart/getCartSession";
import { mergeCartSchema } from "@/lib/validators/cart";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const validation = mergeCartSchema.safeParse(body);

        if (!validation.success) {
            return error(
                "Validation failed",
                400,
                validation.error.flatten().fieldErrors
            );
        }

        const session = await getCartSession(request);

        if (!session.user) {
            return error("Unauthorized", 401);
        }

        if (!session.guestToken) {
            return success(
                null,
                "No guest cart to merge.",
                200
            );
        }

        const result = await mergeCart({
            userCartId: session.cart.id,
            guestToken: session.guestToken,
        });

        return success(result.data, result.message, result.status);
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        console.error(err);
        return error("Something went wrong", 500);
    }
}
