import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { listAdminSellers } from "@/lib/admin/list-sellers";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:sellers:read");

    const query = Object.fromEntries(request.nextUrl.searchParams);

    return listAdminSellers({
        query,
    });
});
