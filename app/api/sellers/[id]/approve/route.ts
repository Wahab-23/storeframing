import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { adminSellerApprovalSchema } from "@/lib/validators/admin-moderation";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const PATCH = withApiHandler(
    async (request: NextRequest, context: RouteContext) => {
        adminSellerApprovalSchema.parse({});

        const admin = await requirePermission(request, "admin:sellers:write");
        const { id: sellerId } = await context.params;

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
                "Only pending seller applications can be approved."
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const updatedSeller = await tx.seller.update({
                where: {
                    id: sellerId,
                },
                data: {
                    status: "ACTIVE",
                    verificationStatus: "VERIFIED",
                },
            });

            const wallet = await tx.sellerWallet.upsert({
                where: {
                    sellerId,
                },
                update: {},
                create: {
                    sellerId,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: admin.id,
                    action: "APPROVE",
                    entityType: "SELLER",
                    entityId: sellerId,
                    oldData: {
                        status: seller.status,
                        verificationStatus: seller.verificationStatus,
                    },
                    newData: {
                        status: "ACTIVE",
                        verificationStatus: "VERIFIED",
                    },
                },
            });

            await tx.notification.create({
                data: {
                    userId: seller.user.id,
                    type: "SELLER",
                    channel: "IN_APP",
                    title: "Seller application approved",
                    message:
                        "Congratulations! Your seller application has been approved. You can now start selling on the marketplace.",
                    data: {
                        sellerId,
                    },
                },
            });

            return {
                seller: updatedSeller,
                wallet,
            };
        });

        return {
            message: "Seller approved successfully.",
            data: result,
        };
    }
);
