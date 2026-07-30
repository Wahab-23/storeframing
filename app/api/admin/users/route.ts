import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getAdminUser } from "@/lib/admin/auth";
import { listAdminUsers } from "@/lib/admin/list-users";

export const GET = withApiHandler(async (request: NextRequest) => {
    await getAdminUser(request);

    const query = Object.fromEntries(request.nextUrl.searchParams);

    return listAdminUsers({
        query,
    });
});
