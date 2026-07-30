import { NextRequest } from "next/server";

import { getAdminContext } from "./get-admin-context";

export async function getAdminUser(request: NextRequest) {
    const { user } = await getAdminContext(request);
    return user;
}
