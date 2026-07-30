import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";
import { requirePermission } from "@/lib/admin/require-permission";
import { AppError } from "@/lib/errors";
import { rejectSellerProductSubmission } from "@/lib/products/workflow";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

const bodySchema = z.object({
    reason: z
        .string()
        .trim()
        .min(5)
        .max(1000)
        .optional(),
});

export const POST = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await requirePermission(request, "admin:products:write");
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    try {
        const result = await rejectSellerProductSubmission({
            adminId: admin.id,
            submissionId: id,
            reason: parsed.data.reason,
        });

        return success(result, "Submission rejected successfully");
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        throw err;
    }
});

