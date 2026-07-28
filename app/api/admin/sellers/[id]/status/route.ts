import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getAdminUser } from "@/lib/admin/auth";
import { moderateSeller } from "@/lib/admin/moderate-seller";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await getAdminUser(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    return moderateSeller({
        adminId: admin.id,
        sellerId: id,
        body,
    });
});
