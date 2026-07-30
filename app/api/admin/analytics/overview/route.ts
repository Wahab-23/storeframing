import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { getAnalytics } from "@/lib/admin/get-analytics";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:analytics:read");

    const query = {
        from: request.nextUrl.searchParams.get("from") ?? undefined,
        to: request.nextUrl.searchParams.get("to") ?? undefined,
    };

    return getAnalytics({
        query,
    });
});
