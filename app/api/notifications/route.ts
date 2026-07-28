import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getNotifications } from "@/lib/notifications/get-notifications";

export const GET = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const query = {
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        unreadOnly:
            request.nextUrl.searchParams.get("unreadOnly") ?? undefined,
    };

    return getNotifications({
        userId: user.id,
        query,
    });
});
