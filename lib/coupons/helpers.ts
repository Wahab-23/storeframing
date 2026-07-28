import { CouponScope } from "@/generated/prisma/client";

import { getShippingFee } from "@/lib/checkout/helpers";

import {
    CouponCartItem,
    CouponEvaluationInput,
    CouponEvaluationResult,
} from "./types";

function roundMoney(value: number) {
    return Math.round(value * 100) / 100;
}

function isProductEligible(
    item: CouponCartItem,
    scope: CouponScope,
    productIds: Set<string>,
    categoryIds: Set<string>,
    sellerId: string | null
) {
    if (scope === "GLOBAL") {
        return true;
    }

    if (scope === "SELLER") {
        return sellerId != null && item.listing.sellerId === sellerId;
    }

    if (scope === "PRODUCT") {
        return productIds.has(item.productId);
    }

    if (scope === "CATEGORY") {
        return item.product.categories.some((category) =>
            categoryIds.has(category.categoryId)
        );
    }

    return false;
}

export function calculateCouponDiscount({
    coupon,
    items,
    subtotal,
    shippingMethod,
}: CouponEvaluationInput): CouponEvaluationResult {
    const productIds = new Set(
        coupon.products.map((item) => item.productId)
    );
    const categoryIds = new Set(
        coupon.categories.map((item) => item.categoryId)
    );

    let eligibleSubtotal = 0;
    const eligibleSellerSubtotals = new Map<string, number>();

    for (const item of items) {
        const lineSubtotal = Number(item.unitPrice) * item.quantity;
        const eligible = isProductEligible(
            item,
            coupon.scope,
            productIds,
            categoryIds,
            coupon.sellerId
        );

        if (!eligible) {
            continue;
        }

        eligibleSubtotal += lineSubtotal;

        const sellerSubtotal =
            eligibleSellerSubtotals.get(item.listing.sellerId) ?? 0;

        eligibleSellerSubtotals.set(
            item.listing.sellerId,
            sellerSubtotal + lineSubtotal
        );
    }

    let itemDiscountAmount = 0;
    let shippingDiscountAmount = 0;

    if (coupon.discountType === "PERCENTAGE") {
        itemDiscountAmount = roundMoney(
            eligibleSubtotal *
                (Number(coupon.discountValue) / 100)
        );
    } else if (coupon.discountType === "FIXED_AMOUNT") {
        itemDiscountAmount = roundMoney(
            Math.min(Number(coupon.discountValue), eligibleSubtotal)
        );
    } else if (coupon.discountType === "FREE_SHIPPING") {
        shippingDiscountAmount = roundMoney(
            shippingMethod ? getShippingFee(shippingMethod, subtotal) : 0
        );
    }

    const maximumDiscountAmount = coupon.maximumDiscountAmount
        ? Number(coupon.maximumDiscountAmount)
        : null;

    let discountAmount = itemDiscountAmount + shippingDiscountAmount;

    if (
        maximumDiscountAmount != null &&
        discountAmount > maximumDiscountAmount
    ) {
        if (itemDiscountAmount >= maximumDiscountAmount) {
            itemDiscountAmount = roundMoney(maximumDiscountAmount);
            shippingDiscountAmount = 0;
        } else {
            shippingDiscountAmount = roundMoney(
                Math.min(
                    shippingDiscountAmount,
                    maximumDiscountAmount - itemDiscountAmount
                )
            );
        }

        discountAmount = itemDiscountAmount + shippingDiscountAmount;
    }

    return {
        eligibleSubtotal: roundMoney(eligibleSubtotal),
        eligibleSellerSubtotals,
        itemDiscountAmount: roundMoney(itemDiscountAmount),
        shippingDiscountAmount: roundMoney(shippingDiscountAmount),
        discountAmount: roundMoney(discountAmount),
    };
}
