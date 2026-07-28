import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { placeOrder } from "@/lib/checkout/place-order";

export const POST = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const body = await request.json().catch(() => ({}));

    return placeOrder({
        userId: user.id,
        body,
    });
});
