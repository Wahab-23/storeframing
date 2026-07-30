import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";
import { requirePermission } from "@/lib/admin/require-permission";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
        .enum([
            "DRAFT",
            "SUBMITTED",
            "PENDING_REVIEW",
            "UNDER_REVIEW",
            "APPROVED",
            "REJECTED",
            "RESUBMITTED",
        ])
        .optional(),
});

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:products:read");

    const parsed = querySchema.safeParse({
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const where = {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
    };

    const [submissions, total] = await prisma.$transaction([
        prisma.productSubmission.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (parsed.data.page - 1) * parsed.data.limit,
            take: parsed.data.limit,
            select: {
                id: true,
                title: true,
                status: true,
                rejectionReason: true,
                submittedAt: true,
                reviewedAt: true,
                createdAt: true,
                updatedAt: true,
                productId: true,
                payload: true,
                seller: {
                    select: {
                        id: true,
                        shopName: true,
                        slug: true,
                        status: true,
                    },
                },
                reviewedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        }),
        prisma.productSubmission.count({ where }),
    ]);

    return success(
        {
            submissions,
            pagination: {
                page: parsed.data.page,
                limit: parsed.data.limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / parsed.data.limit)),
            },
        },
        "Product submissions fetched successfully"
    );
});

