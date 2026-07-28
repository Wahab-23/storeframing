import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { calculateCart } from "@/lib/cart/calculate-cart";
import { GetCartInput } from "@/lib/cart/types";

type RemoveCartItemInput = GetCartInput & {
    cartItemId: string;
};

export async function removeCartItem({
    cart,
    cartItemId,
}: RemoveCartItemInput) {
    const cartItem = await prisma.cartItem.findFirst({
        where: {
            id: cartItemId,
            cartId: cart.id,
        },
        select: {
            id: true,
        },
    });

    if (!cartItem) {
        throw new AppError(404, "Cart item not found.");
    }

    await prisma.cartItem.delete({
        where: {
            id: cartItem.id,
        },
    });

    const summary = await calculateCart(cart.id);

    return {
        status: 200,
        message: "Item removed from cart.",
        data: summary,
    };
}
