import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:sellers:read");

    const statusParam = request.nextUrl.searchParams.get("status") || "ALL";

    const where = statusParam === "ALL"
        ? {
            OR: [
                { documents: { some: {} } },
                { verificationStatus: { in: ["PENDING", "UNVERIFIED"] as any } }
            ]
        }
        : statusParam === "DOCS_PENDING"
            ? { documents: { some: { status: "PENDING" as any } } }
            : { verificationStatus: statusParam as any };

    const sellers = await prisma.seller.findMany({
        where,
        select: {
            id: true,
            shopName: true,
            slug: true,
            status: true,
            verificationStatus: true,
            trustBadge: true,
            businessEmail: true,
            businessPhone: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                }
            },
            documents: {
                select: {
                    id: true,
                    type: true,
                    fileUrl: true,
                    status: true,
                    notes: true,
                    createdAt: true,
                    reviewedAt: true,
                },
                orderBy: { createdAt: "desc" }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return { data: sellers };
});

export const POST = withApiHandler<any>(async (request: NextRequest) => {
    const admin = await requirePermission(request, "admin:sellers:write");
    const body = await request.json();

    const { sellerId, action, documentId, status, notes } = body;

    if (!sellerId && !documentId) {
        throw new AppError(400, "Seller ID or Document ID is required.");
    }

    // Direct Vendor Verification Approval
    if (action === "VERIFY_VENDOR" || (sellerId && status === "VERIFIED")) {
        const { awardTrustBadge = false } = body;

        const updatedSeller = await prisma.$transaction(async (tx) => {
            const seller = await tx.seller.update({
                where: { id: sellerId },
                data: {
                    verificationStatus: "VERIFIED",
                    ...(awardTrustBadge ? {
                        trustBadge: "VERIFIED_SELLER",
                        trustBadgeAwardedAt: new Date(),
                        trustBadgeRemovedAt: null,
                    } : {}),
                },
                include: {
                    user: true,
                    documents: true,
                }
            });

            // Mark all pending docs as approved
            await tx.sellerDocument.updateMany({
                where: { sellerId, status: "PENDING" },
                data: {
                    status: "APPROVED",
                    reviewedAt: new Date(),
                    notes: notes || "Verified and approved by admin."
                }
            });

            await tx.auditLog.create({
                data: {
                    userId: admin.id,
                    action: "APPROVE",
                    entityType: "SELLER",
                    entityId: sellerId,
                    newData: {
                        verificationStatus: "VERIFIED",
                        trustBadge: seller.trustBadge,
                    }
                }
            });

            return seller;
        });

        return {
            data: updatedSeller,
            message: awardTrustBadge
                ? "Vendor KYC verified and trust badge awarded."
                : "Vendor KYC has been officially verified."
        };
    }

    // Direct Vendor Verification Rejection
    if (action === "REJECT_VERIFICATION" || (sellerId && status === "REJECTED")) {
        const updatedSeller = await prisma.$transaction(async (tx) => {
            const seller = await tx.seller.update({
                where: { id: sellerId },
                data: {
                    verificationStatus: "REJECTED",
                    trustBadge: "NONE",
                    trustBadgeRemovedAt: new Date(),
                },
                include: {
                    user: true,
                    documents: true,
                }
            });

            await tx.sellerDocument.updateMany({
                where: { sellerId, status: "PENDING" },
                data: {
                    status: "REJECTED",
                    reviewedAt: new Date(),
                    notes: notes || "Verification rejected by admin."
                }
            });

            await tx.auditLog.create({
                data: {
                    userId: admin.id,
                    action: "REJECT",
                    entityType: "SELLER",
                    entityId: sellerId,
                    newData: {
                        verificationStatus: "REJECTED",
                        notes,
                    }
                }
            });

            return seller;
        });

        return {
            data: updatedSeller,
            message: "Vendor verification has been rejected."
        };
    }

    // Single Document Review Action
    if (documentId) {
        const updatedDoc = await prisma.sellerDocument.update({
            where: { id: documentId },
            data: {
                status,
                notes: notes ?? undefined,
                reviewedAt: new Date(),
            }
        });

        return {
            data: updatedDoc,
            message: "Document status updated successfully."
        };
    }

    return { data: { success: true } };
});
