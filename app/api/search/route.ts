import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/search";

/**
 * GET /api/search?q=...&page=1&limit=20&filter=...&sort=...&facets=...
 *
 * Query params:
 *  q       - search query string (required)
 *  page    - page number (default: 1)
 *  limit   - hits per page (default: 20, max: 100)
 *  filter  - Meilisearch filter string, e.g. "brandId = abc AND price < 500"
 *  sort    - comma-separated sort fields, e.g. "price:asc,averageRating:desc"
 *  facets  - comma-separated attributes to return facet counts for
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const q = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
        100,
        Math.max(1, Number(searchParams.get("limit")) || 20)
    );

    const filterParam = searchParams.get("filter");
    const sortParam = searchParams.get("sort");
    const facetsParam = searchParams.get("facets");

    const sort = sortParam
        ? sortParam.split(",").map((s) => s.trim())
        : undefined;

    const facets = facetsParam
        ? facetsParam.split(",").map((f) => f.trim())
        : undefined;

    try {
        const results = await searchProducts({
            query: q,
            filter: filterParam ?? undefined,
            sort,
            offset: (page - 1) * limit,
            limit,
            facets,
        });

        return NextResponse.json({
            success: true,
            data: {
                hits: results.hits,
                query: results.query,
                processingTimeMs: results.processingTimeMs,
                estimatedTotalHits: results.estimatedTotalHits,
                offset: results.offset,
                limit: results.limit,
                facetDistribution: results.facetDistribution,
            },
        });
    } catch (err) {
        console.error("[search] Error:", err);
        return NextResponse.json(
            { success: false, message: "Search failed." },
            { status: 500 }
        );
    }
}
