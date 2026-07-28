import { z } from "zod";

import {
    CHECKOUT_PAYMENT_METHODS,
    CHECKOUT_SHIPPING_METHODS,
} from "@/lib/checkout/constants";

export const checkoutSelectionSchema = z.object({
    billingAddressId: z.string().cuid2(),
    shippingAddressId: z.string().cuid2(),
});

export const checkoutShippingSchema = z.object({
    shippingMethod: z.enum(CHECKOUT_SHIPPING_METHODS),
});

export const checkoutPaymentSchema = z.object({
    paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS),
});

export const placeOrderSchema = z.object({
    billingAddressId: z.string().cuid2(),
    shippingAddressId: z.string().cuid2(),
    shippingMethod: z.enum(CHECKOUT_SHIPPING_METHODS),
    paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS),
    couponCode: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .transform((value) => value.toUpperCase())
        .optional()
        .nullable(),
    customerNote: z.string().trim().max(1000).nullable().optional(),
});
