import { NextRequest } from "next/server";
import { z } from "zod";

import { success, error } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { addItemToCart } from "@/lib/cart/add-item";
import { getCartSession } from "@/lib/cart/getCartSession";

const cartItemAddSchema = z.object({
    listingId: z.string().cuid2(),
    listingVariantId: z.string().cuid2().optional().nullable(),
    quantity: z.number().int().min(1).max(100),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = cartItemAddSchema.safeParse(body);

        if (!validation.success) {
            return error(
                "Validation failed",
                400,
                validation.error.flatten().fieldErrors
            );
        }

        const { cart, user } = await getCartSession(request);

        const result = await addItemToCart({
            cart,
            user,
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
