import { CartItemDto, CartItemWithRelations } from "@/lib/cart/types";

export function mapCartItem(
    item: CartItemWithRelations,
    availableQuantity: number
): CartItemDto {
    return {
        id: item.id,

        quantity: item.quantity,

        unitPrice: Number(item.unitPrice),

        subtotal:
            Number(item.unitPrice) *
            item.quantity,

        product: item.product,

        seller: item.listing.seller,

        listing: {
            id: item.listing.id,
        },

        variant: item.listingVariant,

        availability: {
            availableQuantity,

            inStock:
                availableQuantity > 0,
        },
    };
}
