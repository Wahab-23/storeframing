import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createReturnRequest } from "@/lib/returns/create-return-request";
import { createReturnRequestSchema } from "@/lib/validators/returns";

export const POST = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const body = await request.json().catch(() => ({}));
    const validation = createReturnRequestSchema.safeParse(body);

    if (!validation.success) {
        throw new ValidationError("Validation failed");
    }

    return createReturnRequest({
        userId: user.id,
        body: validation.data,
    });
});
