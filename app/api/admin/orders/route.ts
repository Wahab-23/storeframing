import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { listAdminOrders } from "@/lib/admin/list-orders";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:orders:read");

    const query = Object.fromEntries(request.nextUrl.searchParams);

    return listAdminOrders({
        query,
    });
});
