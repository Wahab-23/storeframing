import { prisma } from "@/lib/prisma";
import { AppError, ValidationError } from "@/lib/errors";
import { addCartItemSchema } from "@/lib/validators/cart";
import { AddCartItemInput } from "@/lib/cart/types";
import { cartItemInclude } from "@/lib/cart/constants";

export async function addItemToCart({
    body,
    cart,
}: AddCartItemInput) {
    const parsed =
        addCartItemSchema.safeParse(body);

    if (!parsed.success) {
        throw new ValidationError(
            "Invalid request data."
        );
    }

    const {
        listingId,
        listingVariantId,
        quantity,
    } = parsed.data;

    const listing =
        await prisma.sellerListing.findUnique({
            where: {
                id: listingId,
            },

            include: {
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

                inventory: true,

                variants: {
                    include: {
                        variant: true,
                        inventory: true,
                    },
                },
            },
        });

    if (!listing) {
        throw new AppError(
            404,
            "Listing not found."
        );
    }

    if (listing.status !== "ACTIVE") {
        throw new AppError(
            400,
            "Listing is inactive."
        );
    }

    if (listing.seller.status !== "ACTIVE") {
        throw new AppError(
            400,
            "Seller account is inactive."
        );
    }

    if (
        listing.product.deletedAt ||
        listing.product.status !== "ACTIVE"
    ) {
        throw new AppError(
            400,
            "Product is unavailable."
        );
    }

    const listingVariant =
        listingVariantId
            ? listing.variants.find(
                (item) =>
                    item.id ===
                    listingVariantId
            ) ?? null
            : null;

    if (
        listingVariantId &&
        !listingVariant
    ) {
        throw new AppError(
            404,
            "Variant not found."
        );
    }

    const inventory =
        listingVariant?.inventory ??
        listing.inventory;

    if (!inventory) {
        throw new AppError(
            400,
            "Inventory not configured."
        );
    }

    const availableQuantity =
        Math.max(
            inventory.quantity -
            inventory.reservedQuantity,
            0
        );

    if (availableQuantity === 0) {
        throw new AppError(
            409,
            "This item is currently out of stock."
        );
    }

    if (quantity > availableQuantity) {
        throw new AppError(
            409,
            `Only ${availableQuantity} item(s) available.`
        );
    }

    const unitPrice =
        listingVariant?.price ??
        listing.price;
    // Build the uniqueKey that deterministically identifies this item in the cart.
    // Simple product: "listingId"
    // Configurable product: "listingId:listingVariantId"
    const uniqueKey = listingVariantId
        ? `${listingId}:${listingVariantId}`
        : listingId;

    const existingCartItem =
        await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                uniqueKey,
            },
        });

    const finalQuantity =
        (existingCartItem?.quantity ?? 0) +
        quantity;

    if (finalQuantity > availableQuantity) {
        throw new AppError(
            409,
            `Only ${availableQuantity} item(s) available.`
        );
    }

    const cartItem =
        await prisma.$transaction(async (tx) => {
            if (existingCartItem) {
                return tx.cartItem.update({
                    where: {
                        id: existingCartItem.id,
                    },

                    data: {
                        quantity: finalQuantity,
                        unitPrice,

                        productId:
                            listing.product.id,
                    },

                    include: cartItemInclude,
                });
            }

            return tx.cartItem.create({
                data: {
                    cartId: cart.id,

                    productId:
                        listing.product.id,

                    listingId,

                    listingVariantId:
                        listingVariantId ??
                        null,

                    uniqueKey,

                    quantity,

                    unitPrice,
                },

                include: cartItemInclude,
            });
        });

    const availableAfterUpdate =
        Math.max(
            availableQuantity -
            cartItem.quantity,
            0
        );

    const subtotal =
        Number(cartItem.unitPrice) *
        cartItem.quantity;

    return {
        status: 200,

        message: existingCartItem
            ? "Cart updated successfully."
            : "Item added to cart.",

        data: {
            item: {
                id: cartItem.id,

                quantity:
                    cartItem.quantity,

                unitPrice:
                    Number(
                        cartItem.unitPrice
                    ),

                subtotal,

                product: cartItem.product,

                seller:
                    cartItem.listing
                        .seller,

                listing: {
                    id: cartItem.listing.id,
                },

                variant:
                    cartItem.listingVariant,

                availability: {
                    inStock:
                        availableAfterUpdate >
                        0,

                    availableQuantity:
                        availableAfterUpdate,
                },
            },
        },
    };
}
