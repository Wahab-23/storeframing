import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getAddresses } from "@/lib/address/get-addresses";
import { createAddress } from "@/lib/address/create-address";
import { createAddressSchema } from "@/lib/validators/address";

export const GET = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    return getAddresses({
        userId: user.id,
    });
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const body = await request.json().catch(() => ({}));
    const validation = createAddressSchema.safeParse(body);

    if (!validation.success) {
        throw new ValidationError("Validation failed");
    }

    return createAddress({
        userId: user.id,
        body: validation.data,
    });
});
