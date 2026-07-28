import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { getAvailableInventory } from "./inventory";

export async function calculateCart(
    cartId: string
) {
    const cart = await prisma.cart.findUnique({
        where: {
            id: cartId,
        },

        include: {
            items: {
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
            },
        },
    });

    if (!cart) {
        throw new AppError(
            404,
            "Cart not found."
        );
    }

    let itemCount = 0;
    let unavailableItems = 0;
    let subtotal = 0;

    const items = cart.items.map((item) => {
        const inventory =
            item.listingVariant?.inventory ??
            item.listing.inventory;

        const availableQuantity = inventory
            ? getAvailableInventory(
                inventory.quantity,
                inventory.reservedQuantity
            )
            : 0;

        const available =
            availableQuantity >= item.quantity;

        const lineSubtotal =
            Number(item.unitPrice) *
            item.quantity;

        if (!available) {
            unavailableItems++;
        }

        subtotal += lineSubtotal;
        itemCount += item.quantity;

        return {
            id: item.id,

            quantity: item.quantity,

            unitPrice: Number(
                item.unitPrice
            ),

            subtotal: lineSubtotal,

            available,

            availableQuantity,
        };
    });

    const discount = 0;
    const shipping = 0;
    const tax = 0;

    const grandTotal =
        subtotal -
        discount +
        shipping +
        tax;

    return {
        cart: {
            id: cart.id,
            status: cart.status,
        },

        items,

        summary: {
            itemCount,
            subtotal,
            discount,
            shipping,
            tax,
            grandTotal,
            unavailableItems,
        },
    };
}
