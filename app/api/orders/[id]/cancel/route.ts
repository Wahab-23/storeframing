import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { cancelCustomerOrder } from "@/lib/orders/cancel-order";
import { cancelOrderSchema } from "@/lib/validators/orders";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const POST = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const validation = cancelOrderSchema.safeParse(body);

    if (!validation.success) {
        throw new ValidationError("Validation failed");
    }

    return cancelCustomerOrder({
        userId: user.id,
        orderId: id,
        body: validation.data,
    });
});
