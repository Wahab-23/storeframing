import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { getCartSession } from "@/lib/cart/getCartSession";
import { updateCartItem } from "@/lib/cart/update-item";
import { removeCartItem } from "@/lib/cart/remove-item";

const updateCartItemBodySchema = z.object({
    quantity: z.number().int().min(1).max(100),
});

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const validation = updateCartItemBodySchema.safeParse(body);

    if (!validation.success) {
        throw new AppError(400, "Validation failed.");
    }

    const session = await getCartSession(request);

    return updateCartItem({
        cart: session.cart,
        user: session.user,
        cartItemId: id,
        body: validation.data,
    });
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const session = await getCartSession(request);

    return removeCartItem({
        cart: session.cart,
        user: session.user,
        cartItemId: id,
    });
});
