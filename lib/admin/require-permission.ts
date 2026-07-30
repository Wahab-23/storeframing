import { NextRequest } from "next/server";

import { getAdminContext } from "./get-admin-context";

export async function requirePermission(
    request: NextRequest,
    permissionSlug: string
) {
    const { user } = await getAdminContext(request, permissionSlug);
    return user;
}

