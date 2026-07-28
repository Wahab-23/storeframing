import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { markNotificationRead } from "@/lib/notifications/mark-read";
import { markNotificationReadSchema } from "@/lib/validators/notification";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const PATCH = withApiHandler(
    async (request: NextRequest, context: RouteContext) => {
        const user = await getCurrentUser(request);

        if (!user) {
            throw new UnauthorizedError();
        }

        const { id } = await context.params;
        const validation = markNotificationReadSchema.safeParse({ id });

        if (!validation.success) {
            throw new ValidationError("Validation failed.");
        }

        return markNotificationRead({
            userId: user.id,
            id: validation.data.id,
        });
    }
);
