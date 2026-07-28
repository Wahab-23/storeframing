import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { updateAddress } from "@/lib/address/update-address";
import { deleteAddress } from "@/lib/address/delete-address";
import { updateAddressSchema } from "@/lib/validators/address";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const validation = updateAddressSchema.safeParse(body);

    if (!validation.success) {
        throw new ValidationError("Validation failed");
    }

    return updateAddress({
        userId: user.id,
        addressId: id,
        body: validation.data,
    });
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const { id } = await context.params;

    return deleteAddress({
        userId: user.id,
        addressId: id,
    });
});
