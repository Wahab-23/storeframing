import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getCheckout } from "@/lib/checkout/get-checkout";

export const GET = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    return getCheckout({
        userId: user.id,
    });
});
