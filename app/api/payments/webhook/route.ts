import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError } from "@/lib/errors";
import { processPaymentVerification } from "@/lib/payments/process-payment";

export const POST = withApiHandler(async (request: NextRequest) => {
    const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    const providedSecret = request.headers.get("x-payment-webhook-secret");

    if (configuredSecret && providedSecret !== configuredSecret) {
        throw new UnauthorizedError("Invalid webhook secret");
    }

    const body = await request.json().catch(() => ({}));

    return processPaymentVerification({
        body,
        source: "WEBHOOK",
    });
});
