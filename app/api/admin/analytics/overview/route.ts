import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getAdminUser } from "@/lib/admin/auth";
import { getAnalytics } from "@/lib/admin/get-analytics";

export const GET = withApiHandler(async (request: NextRequest) => {
    await getAdminUser(request);

    const query = {
        from: request.nextUrl.searchParams.get("from") ?? undefined,
        to: request.nextUrl.searchParams.get("to") ?? undefined,
    };

    return getAnalytics({
        query,
    });
});
