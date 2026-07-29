import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { listPublicSellers } from "@/lib/sellers/public-sellers";

export const GET = withApiHandler(async (request: NextRequest) => {
    const query = {
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        search: request.nextUrl.searchParams.get("search") ?? undefined,
    };

    return listPublicSellers({
        query,
    });
});
