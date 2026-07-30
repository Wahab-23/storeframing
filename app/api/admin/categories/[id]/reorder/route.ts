import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { error } from "@/lib/api-response";
import { requireAdminAccess } from "@/lib/admin/require-admin-access";
import { reorderCategories } from "@/lib/categories/manage";
import { adminCategoryReorderSchema } from "@/lib/validators/category";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const POST = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requireAdminAccess(request);
    await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = adminCategoryReorderSchema.safeParse(body);

    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    return reorderCategories(parsed.data.items);
});
