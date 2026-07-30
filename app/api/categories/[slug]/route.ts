import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getCategoryBySlug } from "@/lib/categories/manage";

type RouteContext = {
    params: Promise<{
        slug: string;
    }>;
};

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { slug } = await context.params;

    return getCategoryBySlug(slug);
});
