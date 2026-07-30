import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { listAdminProducts } from "@/lib/admin/list-products";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:products:read");

    const query = Object.fromEntries(request.nextUrl.searchParams);

    return listAdminProducts({
        query,
    });
});
