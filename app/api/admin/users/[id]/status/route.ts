import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { moderateUser } from "@/lib/admin/moderate-user";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await requirePermission(request, "admin:users:write");
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    return moderateUser({
        adminId: admin.id,
        userId: id,
        body,
    });
});
