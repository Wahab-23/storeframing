import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { error } from "@/lib/api-response";
import { requireAdminAccess } from "@/lib/admin/require-admin-access";
import {
    deleteCategorySafely,
    getAdminCategoryById,
    updateCategory,
} from "@/lib/categories/manage";
import { adminCategoryUpdateSchema } from "@/lib/validators/category";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requireAdminAccess(request);
    const { id } = await context.params;

    return getAdminCategoryById(id);
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requireAdminAccess(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = adminCategoryUpdateSchema.safeParse(body);

    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const category = await updateCategory(id, parsed.data);

    return {
        status: 200,
        message: "Category updated successfully.",
        data: {
            category,
        },
    };
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requireAdminAccess(request);
    const { id } = await context.params;

    return deleteCategorySafely(id);
});
