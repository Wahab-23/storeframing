import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { getSiteSettings, updateSiteSettings } from "@/lib/admin/site-settings";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "settings:update");
    return getSiteSettings();
});

export const PATCH = withApiHandler(async (request: NextRequest) => {
    const admin = await requirePermission(request, "settings:update");
    const body = await request.json().catch(() => ({}));

    return updateSiteSettings(body, admin.id);
});
