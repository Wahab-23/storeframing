import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { adminSellerRejectionSchema } from "@/lib/validators/admin-moderation";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const PATCH = withApiHandler(
    async (request: NextRequest, context: RouteContext) => {
        const admin = await requirePermission(request, "admin:sellers:write");
        const { id: sellerId } = await context.params;

        const body = await request.json();
        const validationResult = adminSellerRejectionSchema.safeParse(body);

        if (!validationResult.success) {
            throw new AppError(400, "Validation failed.");
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
            throw new AppError(404, "Seller not found.");
        }

        if (
            seller.status !== "PENDING" ||
            seller.verificationStatus !== "PENDING"
        ) {
            throw new AppError(
                409,
                "Only pending seller applications can be rejected."
            );
        }

        const { reason } = validationResult.data;

        const updatedSeller = await prisma.$transaction(async (tx) => {
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
                        verificationStatus: seller.verificationStatus,
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
        });

        return {
            message: "Seller rejected successfully.",
            data: {
                seller: updatedSeller,
            },
        };
    }
);
