import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getAdminUser } from "@/lib/admin/auth";
import { processReturnRefund } from "@/lib/admin/process-refund";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const POST = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await getAdminUser(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    return processReturnRefund({
        adminId: admin.id,
        returnRequestId: id,
        body,
    });
});
