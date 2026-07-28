import { processPaymentVerification } from "@/lib/payments/process-payment";

type VerifyPaymentInput = {
    userId: string;
    body: unknown;
};

export async function verifyPayment({
    userId,
    body,
}: VerifyPaymentInput) {
    return processPaymentVerification({
        actorUserId: userId,
        body,
        source: "CUSTOMER",
    });
}
