import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart/getCart";
import { calculateCart } from "@/lib/cart/calculate-cart";
import { getShippingFee } from "@/lib/checkout/helpers";
import { applyCouponSchema } from "@/lib/validators/coupon";

import { couponCartItemInclude, couponWithRelationsInclude } from "./constants";
import { buildCouponPreviewSummary, serializeCoupon } from "./dto";
import { calculateCouponDiscount } from "./helpers";

type ApplyCouponInput = {
    userId: string;
    body: unknown;
};

export async function applyCoupon({
    userId,
    body,
}: ApplyCouponInput) {
    const parsed = applyCouponSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const cart = await getOrCreateCart(userId);
    const cartSummary = await calculateCart(cart.id);

    const [coupon, couponUsageCount] = await Promise.all([
        prisma.coupon.findUnique({
            where: {
                code: parsed.data.couponCode,
            },
            include: couponWithRelationsInclude,
        }),
        prisma.couponUsage.count({
            where: {
                userId,
                coupon: {
                    code: parsed.data.couponCode,
                },
            },
        }),
    ]);

    if (!coupon) {
        throw new AppError(404, "Coupon not found.");
    }

    if (coupon.status !== "ACTIVE") {
        throw new AppError(400, "Coupon is not active.");
    }

    const now = new Date();

    if (coupon.startsAt && coupon.startsAt > now) {
        throw new AppError(400, "Coupon is not active yet.");
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
        throw new AppError(400, "Coupon has expired.");
    }

    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
        throw new AppError(400, "Coupon usage limit reached.");
    }

    if (coupon.usagePerUser != null && couponUsageCount >= coupon.usagePerUser) {
        throw new AppError(400, "You have already used this coupon.");
    }

    if (coupon.scope === "SELLER" && !coupon.sellerId) {
        throw new AppError(400, "Coupon is not configured correctly.");
    }

    const cartWithCouponItems = await prisma.cart.findUnique({
        where: {
            id: cart.id,
        },
        include: {
            items: {
                include: couponCartItemInclude,
            },
        },
    });

    if (!cartWithCouponItems || cartWithCouponItems.items.length === 0) {
        throw new AppError(400, "Cart is empty.");
    }

    const evaluation = calculateCouponDiscount({
        coupon,
        items: cartWithCouponItems.items,
        subtotal: cartSummary.summary.subtotal,
        shippingMethod: parsed.data.shippingMethod,
    });

    if (evaluation.discountAmount <= 0) {
        throw new AppError(
            400,
            "Coupon does not apply to the current cart."
        );
    }

    const shippingFee = parsed.data.shippingMethod
        ? getShippingFee(
              parsed.data.shippingMethod,
              cartSummary.summary.subtotal
          )
        : 0;

    return {
        status: 200,
        message: "Coupon applied successfully.",
        data: {
            coupon: serializeCoupon(coupon),
            summary: buildCouponPreviewSummary({
                itemCount: cartSummary.summary.itemCount,
                subtotal: cartSummary.summary.subtotal,
                tax: cartSummary.summary.tax,
                unavailableItems: cartSummary.summary.unavailableItems,
                shippingFee,
                itemDiscount: evaluation.itemDiscountAmount,
                shippingDiscount: evaluation.shippingDiscountAmount,
            }),
        },
    };
}
