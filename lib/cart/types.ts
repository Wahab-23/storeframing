import { Cart, Prisma, User } from "@/generated/prisma/client";

export interface AddCartItemBody {
    listingId: string;
    listingVariantId?: string | null;
    quantity: number;
}

export interface UpdateCartItemBody {
    quantity: number;
}

export interface CartSession {
    cart: Cart;
    user: User | null;
    guestToken?: string | null;
}

export interface AddCartItemInput extends CartSession {
    body: AddCartItemBody;
}

export type GetCartInput = CartSession;

export interface CartServiceResponse<T = unknown> {
    status: number;
    message: string;
    data: T;
}

export type CartWithItems = Prisma.CartGetPayload<{
    include: {
        items: {
            include: {
                listing: {
                    include: {
                        inventory: true;
                    };
                };

                listingVariant: {
                    include: {
                        inventory: true;
                    };
                };
            };
        };
    };
}>;

export type CartItemWithInventory = CartWithItems["items"][number];

export type CartItemWithRelations = Prisma.CartItemGetPayload<{
    include: {
        product: {
            select: {
                id: true;
                name: true;
                slug: true;
                images: {
                    orderBy: {
                        sortOrder: "asc";
                    };
                    take: 1;
                    select: {
                        url: true;
                        altText: true;
                    };
                };
            };
        };

        listing: {
            include: {
                seller: {
                    select: {
                        id: true;
                        shopName: true;
                        slug: true;
                        trustBadge: true;
                        status: true;
                    };
                };

                inventory: true;
            };
        };

        listingVariant: {
            include: {
                variant: true;
                inventory: true;
            };
        };
    };
}>;

export interface CartSummary {
    itemCount: number;
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    grandTotal: number;
}

export interface CartAvailability {
    availableQuantity: number;
    inStock: boolean;
}

export interface CartItemDto {
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: CartItemWithRelations["product"];
    seller: CartItemWithRelations["listing"]["seller"];
    listing: {
        id: string;
    };
    variant: CartItemWithRelations["listingVariant"];
    availability: CartAvailability;
}
