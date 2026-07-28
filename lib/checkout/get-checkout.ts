import { prisma } from "@/lib/prisma";
import { calculateCart } from "@/lib/cart/calculate-cart";
import { buildPaymentOptions, buildShippingOptions } from "@/lib/checkout/helpers";

type GetCheckoutInput = {
    userId: string;
};

export async function getCheckout({ userId }: GetCheckoutInput) {
    const [cart, addresses, summary] = await Promise.all([
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
        prisma.address.findMany({
            where: {
                userId,
            },
            orderBy: [
                {
                    isDefault: "desc",
                },
                {
                    createdAt: "desc",
                },
            ],
        }),
        calculateCart(
            (
                await prisma.cart.upsert({
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
                })
            ).id
        ),
    ]);

    return {
        status: 200,
        message: "Checkout data fetched successfully.",
        data: {
            cart,
            summary: summary.summary,
            addresses: {
                billing: addresses,
                shipping: addresses,
            },
            shippingOptions: buildShippingOptions(summary.summary.subtotal),
            paymentOptions: buildPaymentOptions(),
        },
    };
}
