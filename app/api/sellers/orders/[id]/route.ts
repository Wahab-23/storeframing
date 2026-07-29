import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/getCurrentUser";
import {
    getSellerOrderById,
    updateSellerOrderStatus,
} from "@/lib/sellers/orders";
import { sellerOrderStatusSchema } from "@/lib/validators/seller";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const { id } = await context.params;

    return getSellerOrderById(user.id, id);
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const user = await getCurrentUser(request);

    if (!user) {
        throw new UnauthorizedError();
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const validation = sellerOrderStatusSchema.safeParse(body);

    if (!validation.success) {
        throw new ValidationError("Validation failed");
    }

    return updateSellerOrderStatus(user.id, id, validation.data);
});
