import { AppError } from "@/lib/errors";
import { checkoutPaymentSchema } from "@/lib/validators/checkout";
import { buildPaymentOptions } from "@/lib/checkout/helpers";

type SelectCheckoutPaymentInput = {
    body: unknown;
};

export async function selectCheckoutPayment({
    body,
}: SelectCheckoutPaymentInput) {
    const parsed = checkoutPaymentSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const paymentOptions = buildPaymentOptions();
    const selected = paymentOptions.find(
        (option) => option.method === parsed.data.paymentMethod
    );

    if (!selected) {
        throw new AppError(404, "Payment method not found.");
    }

    return {
        status: 200,
        message: "Payment option selected successfully.",
        data: {
            selectedPayment: selected,
            paymentOptions,
        },
    };
}
