import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getAdminUser } from "@/lib/admin/auth";
import { listAdminOrders } from "@/lib/admin/list-orders";

export const GET = withApiHandler(async (request: NextRequest) => {
    await getAdminUser(request);

    const query = {
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        status: request.nextUrl.searchParams.get("status") ?? undefined,
        search: request.nextUrl.searchParams.get("search") ?? undefined,
    };

    return listAdminOrders({
        query,
    });
});
