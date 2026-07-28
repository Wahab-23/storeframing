import { AppError } from "@/lib/errors";
import { getOrCreateCart } from "@/lib/cart/getCart";
import { calculateCart } from "@/lib/cart/calculate-cart";
import { getShippingFee } from "@/lib/checkout/helpers";
import { removeCouponSchema } from "@/lib/validators/coupon";
import { buildCouponPreviewSummary } from "./dto";

type RemoveCouponInput = {
    userId: string;
    body: unknown;
};

export async function removeCoupon({
    userId,
    body,
}: RemoveCouponInput) {
    const parsed = removeCouponSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const cart = await getOrCreateCart(userId);

    const summary = await calculateCart(cart.id);
    const shippingFee = parsed.data.shippingMethod
        ? getShippingFee(
              parsed.data.shippingMethod,
              summary.summary.subtotal
          )
        : 0;

    return {
        status: 200,
        message: "Coupon removed successfully.",
        data: {
            coupon: null,
            summary: buildCouponPreviewSummary({
                itemCount: summary.summary.itemCount,
                subtotal: summary.summary.subtotal,
                tax: summary.summary.tax,
                unavailableItems: summary.summary.unavailableItems,
                shippingFee,
                itemDiscount: 0,
                shippingDiscount: 0,
            }),
        },
    };
}
