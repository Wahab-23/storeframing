import { Coupon } from "@/generated/prisma/client";

import { CouponPreviewSummary, CouponWithRelations } from "./types";

export function serializeCoupon(coupon: CouponWithRelations | Coupon) {
    return {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        status: coupon.status,
        scope: coupon.scope,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minimumOrderAmount: coupon.minimumOrderAmount
            ? Number(coupon.minimumOrderAmount)
            : null,
        maximumDiscountAmount: coupon.maximumDiscountAmount
            ? Number(coupon.maximumDiscountAmount)
            : null,
        usageLimit: coupon.usageLimit,
        usagePerUser: coupon.usagePerUser,
        startsAt: coupon.startsAt,
        expiresAt: coupon.expiresAt,
    };
}

export function buildCouponPreviewSummary(input: {
    itemCount: number;
    subtotal: number;
    tax: number;
    unavailableItems: number;
    shippingFee: number;
    itemDiscount: number;
    shippingDiscount: number;
}): CouponPreviewSummary {
    const shipping = Math.max(
        input.shippingFee - input.shippingDiscount,
        0
    );

    const discount = input.itemDiscount + input.shippingDiscount;

    return {
        itemCount: input.itemCount,
        subtotal: input.subtotal,
        discount,
        itemDiscount: input.itemDiscount,
        shippingDiscount: input.shippingDiscount,
        shipping,
        tax: input.tax,
        grandTotal: input.subtotal - input.itemDiscount + shipping + input.tax,
        unavailableItems: input.unavailableItems,
    };
}
