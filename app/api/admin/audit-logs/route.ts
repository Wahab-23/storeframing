import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { listAuditLogs } from "@/lib/admin/list-audit-logs";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:audit-logs:read");

    const query = {
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        action: request.nextUrl.searchParams.get("action") ?? undefined,
        entityType: request.nextUrl.searchParams.get("entityType") ?? undefined,
        entityId: request.nextUrl.searchParams.get("entityId") ?? undefined,
        userId: request.nextUrl.searchParams.get("userId") ?? undefined,
        from: request.nextUrl.searchParams.get("from") ?? undefined,
        to: request.nextUrl.searchParams.get("to") ?? undefined,
    };

    return listAuditLogs({
        query,
    });
});
