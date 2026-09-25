import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requirePermission(request, "admin:sellers:read");
    const { id } = await context.params;

    const seller = await prisma.seller.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    status: true,
                }
            },
            wallet: true,
            documents: true,
            policies: true,
            vacation: true,
            _count: {
                select: {
                    products: true,
                    sellerOrders: true,
                    reviews: true,
                }
            }
        }
    });

    if (!seller) {
        throw new AppError(404, "Seller not found.");
    }

    return {
        data: seller,
        message: "Seller retrieved successfully."
    };
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await requirePermission(request, "admin:sellers:write");
    const { id } = await context.params;
    const body = await request.json();

    const existingSeller = await prisma.seller.findUnique({
        where: { id },
        include: { user: true }
    });

    if (!existingSeller) {
        throw new AppError(404, "Seller not found.");
    }

    const {
        shopName,
        slug,
        description,
        businessEmail,
        businessPhone,
        logoUrl,
        bannerUrl,
        status,
        verificationStatus,
        trustBadge,
        commissionRate,
        user: userData,
        policies: policyData,
    } = body;

    const updatedSeller = await prisma.$transaction(async (tx) => {
        // Update User info if provided
        if (userData && existingSeller.userId) {
            await tx.user.update({
                where: { id: existingSeller.userId },
                data: {
                    firstName: userData.firstName ?? undefined,
                    lastName: userData.lastName ?? undefined,
                    phone: userData.phone ?? undefined,
                    email: userData.email ?? undefined,
                    status: userData.status ?? undefined,
                }
            });
        }

        // Update Policies if provided
        if (policyData) {
            await tx.sellerPolicy.upsert({
                where: { sellerId: id },
                create: {
                    sellerId: id,
                    shippingPolicy: policyData.shippingPolicy ?? undefined,
                    returnPolicy: policyData.returnPolicy ?? undefined,
                    refundPolicy: policyData.refundPolicy ?? undefined,
                },
                update: {
                    shippingPolicy: policyData.shippingPolicy ?? undefined,
                    returnPolicy: policyData.returnPolicy ?? undefined,
                    refundPolicy: policyData.refundPolicy ?? undefined,
                }
            });
        }

        // Handle trust badge timestamp if changed
        let trustBadgeAwardedAt = existingSeller.trustBadgeAwardedAt;
        let trustBadgeRemovedAt = existingSeller.trustBadgeRemovedAt;
        if (trustBadge && trustBadge !== existingSeller.trustBadge) {
            if (trustBadge === "VERIFIED_SELLER") {
                trustBadgeAwardedAt = new Date();
                trustBadgeRemovedAt = null;
            } else {
                trustBadgeRemovedAt = new Date();
            }
        }

        // Update Seller
        const seller = await tx.seller.update({
            where: { id },
            data: {
                shopName: shopName ?? undefined,
                slug: slug ?? undefined,
                description: description !== undefined ? description : undefined,
                businessEmail: businessEmail !== undefined ? businessEmail : undefined,
                businessPhone: businessPhone !== undefined ? businessPhone : undefined,
                logoUrl: logoUrl !== undefined ? logoUrl : undefined,
                bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined,
                status: status ?? undefined,
                verificationStatus: verificationStatus ?? undefined,
                trustBadge: trustBadge ?? undefined,
                trustBadgeAwardedAt,
                trustBadgeRemovedAt,
                commissionRate: commissionRate !== undefined ? (commissionRate ? Number(commissionRate) : null) : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        status: true,
                    }
                },
                wallet: true,
                policies: true,
                documents: true,
            }
        });

        // Audit log
        await tx.auditLog.create({
            data: {
                userId: admin.id,
                action: "UPDATE",
                entityType: "SELLER",
                entityId: id,
                oldData: {
                    shopName: existingSeller.shopName,
                    status: existingSeller.status,
                    verificationStatus: existingSeller.verificationStatus,
                    trustBadge: existingSeller.trustBadge,
                    commissionRate: existingSeller.commissionRate,
                },
                newData: {
                    shopName: seller.shopName,
                    status: seller.status,
                    verificationStatus: seller.verificationStatus,
                    trustBadge: seller.trustBadge,
                    commissionRate: seller.commissionRate,
                }
            }
        });

        return seller;
    });

    return {
        data: updatedSeller,
        message: "Seller information updated successfully."
    };
});
