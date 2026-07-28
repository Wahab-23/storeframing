import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getAdminUser } from "@/lib/admin/auth";
import { moderateProduct } from "@/lib/admin/moderate-product";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await getAdminUser(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    return moderateProduct({
        adminId: admin.id,
        productId: id,
        body,
    });
});
