import { NextRequest } from "next/server";
import { z } from "zod";

import { success, error } from "@/lib/api-response";
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

export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const validation = updateCartItemBodySchema.safeParse(body);

        if (!validation.success) {
            return error(
                "Validation failed",
                400,
                validation.error.flatten().fieldErrors
            );
        }

        const session = await getCartSession(request);
        const result = await updateCartItem({
            cart: session.cart,
            user: session.user,
            cartItemId: id,
            body: validation.data,
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

export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const session = await getCartSession(request);
        const result = await removeCartItem({
            cart: session.cart,
            user: session.user,
            cartItemId: id,
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
