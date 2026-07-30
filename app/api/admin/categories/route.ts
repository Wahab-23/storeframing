import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requireAdminAccess } from "@/lib/admin/require-admin-access";
import { error } from "@/lib/api-response";
import { listCategories, createCategory } from "@/lib/categories/manage";
import {
    adminCategoryCreateSchema,
    adminCategoryListQuerySchema,
} from "@/lib/validators/category";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requireAdminAccess(request);

    const parsed = adminCategoryListQuerySchema.safeParse({
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        parentId: request.nextUrl.searchParams.get("parentId") ?? undefined,
        isActive: request.nextUrl.searchParams.get("isActive") ?? undefined,
        search: request.nextUrl.searchParams.get("search") ?? undefined,
    });

    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const query = {
        page: parsed.data.page,
        limit: parsed.data.limit,
        parentId:
            parsed.data.parentId === undefined ? undefined : parsed.data.parentId,
        isActive:
            parsed.data.isActive === undefined
                ? undefined
                : parsed.data.isActive === "true",
        search: parsed.data.search,
    };

    return listCategories({
        query,
    });
});

export const POST = withApiHandler(async (request: NextRequest) => {
    await requireAdminAccess(request);

    const body = await request.json().catch(() => ({}));
    const parsed = adminCategoryCreateSchema.safeParse(body);

    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const category = await createCategory(parsed.data);

    return {
        status: 201,
        message: "Category created successfully.",
        data: {
            category,
        },
    };
});
