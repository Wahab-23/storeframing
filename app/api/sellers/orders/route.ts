import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { listSellerOrders } from "@/lib/sellers/orders";

export const GET = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const query = {
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        status: request.nextUrl.searchParams.get("status") ?? undefined,
        search: request.nextUrl.searchParams.get("search") ?? undefined,
    };

    return listSellerOrders({
        userId: user.id,
        query,
    });
});
