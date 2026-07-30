import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { addItemToCart } from "@/lib/cart/add-item";
import { getCartSession } from "@/lib/cart/getCartSession";

const cartItemAddSchema = z.object({
    listingId: z.string().cuid2(),
    listingVariantId: z.string().cuid2().optional().nullable(),
    quantity: z.number().int().min(1).max(100),
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const body = await request.json().catch(() => ({}));
    const validation = cartItemAddSchema.safeParse(body);

    if (!validation.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { cart, user } = await getCartSession(request);

    return addItemToCart({
        cart,
        user,
        body: validation.data,
    });
});
