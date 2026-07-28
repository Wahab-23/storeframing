import { prisma } from "@/lib/prisma";

import {
    AppError,
    ValidationError,
} from "@/lib/errors";

import {
    getAvailableInventory,
} from "./inventory";

import {
    calculateCart,
} from "./calculate-cart";

import {
    updateCartItemSchema,
} from "@/lib/validators/cart";

import {
    GetCartInput,
} from "@/lib/cart/types";

type UpdateCartItemInput =
    GetCartInput & {
        cartItemId: string;
        body: {
            quantity: number;
        };
    };

export async function updateCartItem({
    cart,
    cartItemId,
    body,
}: UpdateCartItemInput) {
    const parsed =
        updateCartItemSchema.safeParse(
            body
        );

    if (!parsed.success) {
        throw new ValidationError(
            "Invalid request."
        );
    }

    const { quantity } =
        parsed.data;

    const cartItem =
        await prisma.cartItem.findFirst({
            where: {
                id: cartItemId,
                cartId: cart.id,
            },

            include: {
                listing: {
                    include: {
                        inventory: true,
                    },
                },

                listingVariant: {
                    include: {
                        inventory: true,
                    },
                },
            },
        });

    if (!cartItem) {
        throw new AppError(
            404,
            "Cart item not found."
        );
    }
    if (quantity <= 0) {
        await prisma.cartItem.delete({
            where: {
                id: cartItem.id,
            },
        });

        const summary =
            await calculateCart(cart.id);

        return {
            status: 200,
            message:
                "Item removed from cart.",
            data: summary,
        };
    }

    const inventory =
        cartItem.listingVariant
            ?.inventory ??
        cartItem.listing.inventory;

    if (!inventory) {
        throw new AppError(
            400,
            "Inventory not configured."
        );
    }

    const availableQuantity =
        getAvailableInventory(
            inventory.quantity,
            inventory.reservedQuantity
        );

    if (
        quantity >
        availableQuantity
    ) {
        throw new AppError(
            409,
            `Only ${availableQuantity} item(s) available.`
        );
    }

    await prisma.cartItem.update({
        where: {
            id: cartItem.id,
        },

        data: {
            quantity,
        },
    });

    const summary =
        await calculateCart(cart.id);

    return {
        status: 200,

        message:
            "Cart updated successfully.",

        data: summary,
    };
}
