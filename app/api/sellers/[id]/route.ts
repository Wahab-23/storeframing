import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getPublicSellerDetail } from "@/lib/sellers/public-seller";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const GET = withApiHandler(async (_request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;

    return getPublicSellerDetail({
        sellerIdOrSlug: id,
    });
});
