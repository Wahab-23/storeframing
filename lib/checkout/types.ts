import {
    CartSummary,
} from "@/lib/cart/types";

export type CheckoutShippingMethod =
    (typeof import("./constants").CHECKOUT_SHIPPING_METHODS)[number];

export type CheckoutPaymentMethod =
    (typeof import("./constants").CHECKOUT_PAYMENT_METHODS)[number];

export interface CheckoutShippingOption {
    method: CheckoutShippingMethod;
    label: string;
    fee: number;
    estimatedDelivery: string;
}

export interface CheckoutPaymentOption {
    method: CheckoutPaymentMethod;
    label: string;
}

export interface CheckoutPreview {
    cart: {
        id: string;
        status: string;
    };
    summary: CartSummary;
    addresses: {
        billing: unknown[];
        shipping: unknown[];
    };
    shippingOptions: CheckoutShippingOption[];
    paymentOptions: CheckoutPaymentOption[];
}
