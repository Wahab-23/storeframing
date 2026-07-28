import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/getCurrentUser";
import { getOrCreateCart } from "@/lib/cart/getCart";
import { CartSession } from "@/lib/cart/types";

const GUEST_COOKIE_NAME = "guest_cart";

export async function getCartSession(
    request: NextRequest
): Promise<CartSession> {
    const user = await getCurrentUser(request);
    const cart = await getOrCreateCart(user?.id);
    const guestToken =
        request.cookies.get(GUEST_COOKIE_NAME)?.value ?? null;

    return {
        cart,
        user,
        guestToken,
    };
}
