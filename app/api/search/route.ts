import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { searchProducts } from "@/lib/search";
import { searchQuerySchema } from "@/lib/validators/search";

export const GET = withApiHandler(async (request: NextRequest) => {
    const parsed = searchQuerySchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { q, page, limit, filter, sort, facets } = parsed.data;

    const results = await searchProducts({
        query: q,
        filter,
        sort: sort ? sort.split(",").map((value) => value.trim()) : undefined,
        offset: (page - 1) * limit,
        limit,
        facets: facets
            ? facets.split(",").map((value) => value.trim())
            : undefined,
    });

    return {
        data: {
            hits: results.hits,
            query: results.query,
            processingTimeMs: results.processingTimeMs,
            estimatedTotalHits: results.estimatedTotalHits,
            offset: results.offset,
            limit: results.limit,
            facetDistribution: results.facetDistribution,
        },
    };
});
