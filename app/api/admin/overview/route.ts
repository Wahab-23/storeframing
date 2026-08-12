import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { getAdminOverview } from "@/lib/admin/get-overview";

export const GET = withApiHandler(async (request: NextRequest) => {
    const user = await requirePermission(request, "admin:overview:read");
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || undefined;

    return getAdminOverview({
        userId: user.id,
        query: { period },
    });
});
