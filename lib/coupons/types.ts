import { Prisma } from "@/generated/prisma/client";

import { CheckoutShippingMethod } from "@/lib/checkout/types";

export type CouponWithRelations = Prisma.CouponGetPayload<{
    include: {
        products: {
            select: {
                productId: true;
            };
        };
        categories: {
            select: {
                categoryId: true;
            };
        };
    };
}>;

export type CouponCartItem = Prisma.CartItemGetPayload<{
    include: {
        product: {
            select: {
                id: true;
                name: true;
                slug: true;
                categories: {
                    select: {
                        categoryId: true;
                    };
                };
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
            select: {
                id: true;
                sellerId: true;
                sellerSku: true;
                compareAtPrice: true;
                condition: true;
                inventory: true;
                seller: {
                    select: {
                        id: true;
                        shopName: true;
                        slug: true;
                        trustBadge: true;
                        status: true;
                    };
                };
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

export interface CouponEvaluationInput {
    coupon: CouponWithRelations;
    items: CouponCartItem[];
    subtotal: number;
    shippingMethod?: CheckoutShippingMethod | null;
}

export interface CouponEvaluationResult {
    eligibleSubtotal: number;
    eligibleSellerSubtotals: Map<string, number>;
    itemDiscountAmount: number;
    shippingDiscountAmount: number;
    discountAmount: number;
}

export interface CouponPreviewSummary {
    itemCount: number;
    subtotal: number;
    discount: number;
    itemDiscount: number;
    shippingDiscount: number;
    shipping: number;
    tax: number;
    grandTotal: number;
    unavailableItems: number;
}
