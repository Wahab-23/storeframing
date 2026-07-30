import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { error } from "@/lib/api-response";
import { requireAdminAccess } from "@/lib/admin/require-admin-access";
import { moveCategory } from "@/lib/categories/manage";
import { adminCategoryMoveSchema } from "@/lib/validators/category";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const POST = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requireAdminAccess(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = adminCategoryMoveSchema.safeParse(body);

    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const category = await moveCategory(id, parsed.data);

    return {
        status: 200,
        message: "Category moved successfully.",
        data: {
            category,
        },
    };
});
