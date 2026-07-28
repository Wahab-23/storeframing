import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { markAllNotificationsRead } from "@/lib/notifications/mark-all-read";
import { markAllNotificationsReadSchema } from "@/lib/validators/notification";

export const POST = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const validation = markAllNotificationsReadSchema.safeParse({});

    if (!validation.success) {
        throw new ValidationError("Validation failed.");
    }

    return markAllNotificationsRead({
        userId: user.id,
    });
});
