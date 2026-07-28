import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getAdminUser } from "@/lib/admin/auth";
import { getAdminOverview } from "@/lib/admin/get-overview";

export const GET = withApiHandler(async (request: NextRequest) => {
    const user = await getAdminUser(request);

    return getAdminOverview({
        userId: user.id,
    });
});
