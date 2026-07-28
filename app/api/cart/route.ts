import { NextRequest } from "next/server";

import { success, error } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { calculateCart } from "@/lib/cart/calculate-cart";
import { clearCart } from "@/lib/cart/clear-cart";
import { getCartSession } from "@/lib/cart/getCartSession";

export async function GET(request: NextRequest) {
    try {
        const { cart } = await getCartSession(request);
        const summary = await calculateCart(cart.id);

        return success(summary, "Cart fetched successfully");
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        console.error(err);
        return error("Something went wrong", 500);
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getCartSession(request);
        const result = await clearCart(session);
        return success(result.data, result.message, result.status);
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        console.error(err);
        return error("Something went wrong", 500);
    }
}
