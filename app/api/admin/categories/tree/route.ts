import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requireAdminAccess } from "@/lib/admin/require-admin-access";
import { getCategoryTree } from "@/lib/categories/manage";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requireAdminAccess(request);

    const includeInactive = request.nextUrl.searchParams.get("includeInactive");

    return getCategoryTree({
        activeOnly: includeInactive !== "true",
    });
});
