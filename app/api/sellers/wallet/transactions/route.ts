import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getWalletTransactions } from "@/lib/wallet/get-transactions";

export const GET = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const query = {
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        type: request.nextUrl.searchParams.get("type") ?? undefined,
    };

    return getWalletTransactions({
        userId: user.id,
        query,
    });
});
