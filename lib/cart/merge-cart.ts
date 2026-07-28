import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { calculateCart } from "@/lib/cart/calculate-cart";
import { getAvailableInventory } from "@/lib/cart/inventory";

type MergeCartInput = {
    userCartId: string;
    guestToken: string;
};

export async function mergeCart({
    userCartId,
    guestToken,
}: MergeCartInput) {
    const [userCart, guestCart] = await Promise.all([
        prisma.cart.findUnique({
            where: {
                id: userCartId,
            },
            include: {
                items: true,
            },
        }),
        prisma.cart.findUnique({
            where: {
                guestToken,
            },
            include: {
                items: {
                    include: {
                        listingVariant: {
                            include: {
                                inventory: true,
                            },
                        },
                        listing: {
                            include: {
                                inventory: true,
                                seller: {
                                    select: {
                                        id: true,
                                        status: true,
                                    },
                                },
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        status: true,
                                        deletedAt: true,
                                    },
                                },
                                variants: {
                                    include: {
                                        variant: true,
                                        inventory: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }),
    ]);

    if (!userCart) {
        throw new AppError(404, "Cart not found.");
    }

    if (!guestCart || guestCart.items.length === 0) {
        const summary = await calculateCart(userCart.id);

        return {
            status: 200,
            message: "No guest cart items to merge.",
            data: summary,
        };
    }

    await prisma.$transaction(async (tx) => {
        for (const item of guestCart.items) {
            const inventory =
                item.listingVariantId && item.listingVariantId !== ""
                    ? item.listingVariant?.inventory ??
                      item.listing.inventory
                    : item.listing.inventory;

            if (!inventory) {
                throw new AppError(400, "Inventory not configured.");
            }

            const availableQuantity = getAvailableInventory(
                inventory.quantity,
                inventory.reservedQuantity
            );

            if (availableQuantity < item.quantity) {
                throw new AppError(
                    409,
                    `Only ${availableQuantity} item(s) available for ${item.productId}.`
                );
            }

            const existing = await tx.cartItem.findFirst({
                where: {
                    cartId: userCart.id,
                    uniqueKey: item.uniqueKey,
                },
                select: {
                    id: true,
                    quantity: true,
                },
            });

            const nextQuantity =
                (existing?.quantity ?? 0) + item.quantity;

            if (nextQuantity > availableQuantity) {
                throw new AppError(
                    409,
                    `Only ${availableQuantity} item(s) available for ${item.productId}.`
                );
            }

            if (existing) {
                await tx.cartItem.update({
                    where: {
                        id: existing.id,
                    },
                    data: {
                        quantity: nextQuantity,
                        unitPrice: item.unitPrice,
                    },
                });
                continue;
            }

            await tx.cartItem.create({
                data: {
                    cartId: userCart.id,
                    productId: item.productId,
                    listingId: item.listingId,
                    variantId: item.variantId,
                    listingVariantId: item.listingVariantId,
                    uniqueKey: item.uniqueKey,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                },
            });
        }

        await tx.cartItem.deleteMany({
            where: {
                cartId: guestCart.id,
            },
        });
    });

    const summary = await calculateCart(userCart.id);

    return {
        status: 200,
        message: "Cart merged successfully.",
        data: summary,
    };
}
