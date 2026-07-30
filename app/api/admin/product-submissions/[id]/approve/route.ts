import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";
import { requirePermission } from "@/lib/admin/require-permission";
import { AppError } from "@/lib/errors";
import { approveSellerProductSubmission } from "@/lib/products/workflow";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const POST = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await requirePermission(request, "admin:products:write");
    const { id } = await context.params;

    try {
        const result = await approveSellerProductSubmission({
            adminId: admin.id,
            submissionId: id,
        });

        return success(result, "Submission approved successfully");
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        throw err;
    }
});

