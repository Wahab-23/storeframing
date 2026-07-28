export const CHECKOUT_SHIPPING_METHODS = [
    "STANDARD",
    "EXPRESS",
    "PICKUP",
] as const;

export const CHECKOUT_PAYMENT_METHODS = [
    "COD",
    "BANK_TRANSFER",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "WALLET",
    "ONLINE",
    "OTHER",
] as const;

export const FREE_SHIPPING_THRESHOLD = 200000;
export const STANDARD_SHIPPING_FEE = 490;
export const EXPRESS_SHIPPING_FEE = 990;
