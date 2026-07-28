import { z } from "zod";

import { CHECKOUT_SHIPPING_METHODS } from "@/lib/checkout/constants";

export const applyCouponSchema = z.object({
    couponCode: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .transform((value) => value.toUpperCase()),

    shippingMethod: z.enum(CHECKOUT_SHIPPING_METHODS).optional(),
});

export const removeCouponSchema = z.object({
    shippingMethod: z.enum(CHECKOUT_SHIPPING_METHODS).optional(),
});
