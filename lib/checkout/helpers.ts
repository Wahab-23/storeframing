import {
    EXPRESS_SHIPPING_FEE,
    FREE_SHIPPING_THRESHOLD,
    STANDARD_SHIPPING_FEE,
    CHECKOUT_PAYMENT_METHODS,
    CHECKOUT_SHIPPING_METHODS,
} from "@/lib/checkout/constants";

export function buildShippingOptions(subtotal: number) {
    return [
        {
            method: "STANDARD" as const,
            label: "Standard delivery",
            fee:
                subtotal >= FREE_SHIPPING_THRESHOLD
                    ? 0
                    : STANDARD_SHIPPING_FEE,
            estimatedDelivery: "3-5 business days",
        },
        {
            method: "EXPRESS" as const,
            label: "Express delivery",
            fee: EXPRESS_SHIPPING_FEE,
            estimatedDelivery: "1-2 business days",
        },
        {
            method: "PICKUP" as const,
            label: "Store pickup",
            fee: 0,
            estimatedDelivery: "Ready in 1-2 business days",
        },
    ];
}

export function getShippingFee(
    method: (typeof CHECKOUT_SHIPPING_METHODS)[number],
    subtotal: number
) {
    const option = buildShippingOptions(subtotal).find(
        (item) => item.method === method
    );

    return option?.fee ?? 0;
}

export function buildPaymentOptions() {
    return CHECKOUT_PAYMENT_METHODS.map((method) => ({
        method,
        label:
            method === "COD"
                ? "Cash on delivery"
                : method === "BANK_TRANSFER"
                    ? "Bank transfer"
                    : method === "CREDIT_CARD"
                        ? "Credit card"
                        : method === "DEBIT_CARD"
                            ? "Debit card"
                            : method === "WALLET"
                                ? "Wallet"
                                : method === "ONLINE"
                                    ? "Online payment"
                                    : "Other",
    }));
}
