import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { getReportsSummary } from "@/lib/admin/get-reports-summary";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:reports:read");

    const query = {
        from: request.nextUrl.searchParams.get("from") ?? undefined,
        to: request.nextUrl.searchParams.get("to") ?? undefined,
    };

    return getReportsSummary({
        query,
    });
});
