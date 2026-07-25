import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { userHasPermission } from "@/lib/auth";

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

        const canApproveSeller = await userHasPermission(
            admin.id,
            "seller.approve"
        );

        if (!canApproveSeller) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Forbidden",
                },
                { status: 403 }
            );
        }

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
                        "Only pending seller applications can be approved",
                },
                { status: 409 }
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
                        verificationStatus:
                            seller.verificationStatus,
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

        return NextResponse.json({
            success: true,
            message: "Seller approved successfully",
            data: result,
        });
    } catch (error) {
        console.error("Approve seller error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    }
}