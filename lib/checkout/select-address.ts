import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { checkoutSelectionSchema } from "@/lib/validators/checkout";
import { calculateCart } from "@/lib/cart/calculate-cart";
import { buildPaymentOptions, buildShippingOptions } from "@/lib/checkout/helpers";

type SelectCheckoutAddressInput = {
    userId: string;
    body: unknown;
};

export async function selectCheckoutAddress({
    userId,
    body,
}: SelectCheckoutAddressInput) {
    const parsed = checkoutSelectionSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { billingAddressId, shippingAddressId } = parsed.data;

    const [billingAddress, shippingAddress, cart] = await Promise.all([
        prisma.address.findFirst({
            where: {
                id: billingAddressId,
                userId,
            },
        }),
        prisma.address.findFirst({
            where: {
                id: shippingAddressId,
                userId,
            },
        }),
        prisma.cart.upsert({
            where: {
                userId_status: {
                    userId,
                    status: "ACTIVE",
                },
            },
            update: {},
            create: {
                userId,
                status: "ACTIVE",
            },
        }),
    ]);

    if (!billingAddress || !shippingAddress) {
        throw new AppError(404, "Address not found.");
    }

    const summary = await calculateCart(cart.id);

    return {
        status: 200,
        message: "Checkout addresses selected successfully.",
        data: {
            billingAddress,
            shippingAddress,
            summary: summary.summary,
            shippingOptions: buildShippingOptions(summary.summary.subtotal),
            paymentOptions: buildPaymentOptions(),
        },
    };
}
