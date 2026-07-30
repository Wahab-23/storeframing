import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requireAdminAccess } from "@/lib/admin/require-admin-access";
import { restoreCategory } from "@/lib/categories/manage";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const POST = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requireAdminAccess(request);
    const { id } = await context.params;

    return restoreCategory(id);
});
