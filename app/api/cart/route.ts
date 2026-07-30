import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { calculateCart } from "@/lib/cart/calculate-cart";
import { clearCart } from "@/lib/cart/clear-cart";
import { getCartSession } from "@/lib/cart/getCartSession";

export const GET = withApiHandler(async (request: NextRequest) => {
    const { cart } = await getCartSession(request);
    const summary = await calculateCart(cart.id);

    return {
        data: summary,
        message: "Cart fetched successfully",
    };
});

export const DELETE = withApiHandler(async (request: NextRequest) => {
    const session = await getCartSession(request);
    return clearCart(session);
});
