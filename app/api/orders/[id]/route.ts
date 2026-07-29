import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getCustomerOrderById } from "@/lib/orders/get-order";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const { id } = await context.params;

    return getCustomerOrderById({
        userId: user.id,
        orderId: id,
    });
});
