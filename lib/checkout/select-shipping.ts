import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { checkoutShippingSchema } from "@/lib/validators/checkout";
import { calculateCart } from "@/lib/cart/calculate-cart";
import { buildShippingOptions } from "@/lib/checkout/helpers";

type SelectCheckoutShippingInput = {
    userId: string;
    body: unknown;
};

export async function selectCheckoutShipping({
    userId,
    body,
}: SelectCheckoutShippingInput) {
    const parsed = checkoutShippingSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const cart = await prisma.cart.upsert({
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
    });

    const summary = await calculateCart(cart.id);
    const options = buildShippingOptions(summary.summary.subtotal);
    const selected = options.find(
        (option) => option.method === parsed.data.shippingMethod
    );

    if (!selected) {
        throw new AppError(404, "Shipping method not found.");
    }

    return {
        status: 200,
        message: "Shipping option selected successfully.",
        data: {
            selectedShipping: selected,
            summary: {
                ...summary.summary,
                shipping: selected.fee,
                grandTotal:
                    summary.summary.subtotal -
                    summary.summary.discount +
                    selected.fee +
                    summary.summary.tax,
            },
            shippingOptions: options,
        },
    };
}
