import { prisma } from "@/lib/prisma";
import { calculateCart } from "@/lib/cart/calculate-cart";
import { GetCartInput } from "@/lib/cart/types";

export async function clearCart({
    cart,
}: GetCartInput) {
    await prisma.cartItem.deleteMany({
        where: {
            cartId: cart.id,
        },
    });

    const summary = await calculateCart(cart.id);

    return {
        status: 200,
        message: "Cart cleared successfully.",
        data: summary,
    };
}
