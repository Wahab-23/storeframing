import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { userHasPermission } from "@/lib/auth";

const rejectionSchema = z.object({
    reason: z
        .string()
        .min(5, "Rejection reason must be at least 5 characters")
        .max(1000),
});

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const admin = await getCurrentUser(request);

        if (!admin) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }

        const canRejectSeller = await userHasPermission(
            admin.id,
            "seller.reject"
        );

        if (!canRejectSeller) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Forbidden",
                },
                { status: 403 }
            );
        }

        const { id: sellerId } = await context.params;

        const body = await request.json();

        const validationResult =
            rejectionSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    errors:
                        validationResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const seller = await prisma.seller.findUnique({
            where: {
                id: sellerId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!seller) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Seller not found",
                },
                { status: 404 }
            );
        }

        if (
            seller.status !== "PENDING" ||
            seller.verificationStatus !== "PENDING"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Only pending seller applications can be rejected",
                },
                { status: 409 }
            );
        }

        const { reason } = validationResult.data;

        const updatedSeller = await prisma.$transaction(
            async (tx) => {
                const updated = await tx.seller.update({
                    where: {
                        id: sellerId,
                    },
                    data: {
                        status: "REJECTED",
                        verificationStatus: "REJECTED",
                    },
                });

                await tx.auditLog.create({
                    data: {
                        userId: admin.id,
                        action: "REJECT",
                        entityType: "SELLER",
                        entityId: sellerId,

                        oldData: {
                            status: seller.status,
                            verificationStatus:
                                seller.verificationStatus,
                        },

                        newData: {
                            status: "REJECTED",
                            verificationStatus: "REJECTED",
                            reason,
                        },
                    },
                });

                await tx.notification.create({
                    data: {
                        userId: seller.user.id,
                        type: "SELLER",
                        channel: "IN_APP",
                        title: "Seller application rejected",
                        message: `Your seller application was rejected. Reason: ${reason}`,
                        data: {
                            sellerId,
                            reason,
                        },
                    },
                });

                return updated;
            }
        );

        return NextResponse.json({
            success: true,
            message: "Seller rejected successfully",
            data: {
                seller: updatedSeller,
            },
        });
    } catch (error) {
        console.error("Reject seller error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    }
}