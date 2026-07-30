import { NextRequest } from "next/server";

import { getAdminUser } from "./auth";

export async function requireAdminAccess(request: NextRequest) {
    return getAdminUser(request);
}