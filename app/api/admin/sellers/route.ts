import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { listAdminSellers } from "@/lib/admin/list-sellers";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:sellers:read");

    const query = Object.fromEntries(request.nextUrl.searchParams);

    return listAdminSellers({
        query,
    });
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const admin = await requirePermission(request, "admin:sellers:write");
    const body = await request.json();

    const {
        shopName,
        slug,
        description,
        businessEmail,
        businessPhone,
        status = "PENDING",
        verificationStatus = "UNVERIFIED",
        commissionRate,
        logoUrl,
        bannerUrl,
        documents,
        ownerEmail,
        ownerPassword,
        firstName,
        lastName,
        phone,
    } = body;

    if (!shopName || !ownerEmail) {
        throw new AppError(400, "Shop name and owner email are required.");
    }

    // Generate or sanitize slug
    const finalSlug = (slug || shopName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    // Check if slug or shopName is taken
    const existingShop = await prisma.seller.findFirst({
        where: {
            OR: [{ slug: finalSlug }, { shopName }]
        }
    });

    if (existingShop) {
        throw new AppError(409, "A vendor with this shop name or slug already exists.");
    }

    const result = await prisma.$transaction(async (tx) => {
        // Find or create User
        let user = await tx.user.findUnique({
            where: { email: ownerEmail }
        });

        // Get or ensure SELLER role exists
        let sellerRole = await tx.role.findFirst({
            where: { slug: "seller", sellerId: null }
        });

        if (!sellerRole) {
            sellerRole = await tx.role.create({
                data: {
                    name: "Seller",
                    slug: "seller",
                    description: "Marketplace seller vendor"
                }
            });
        }

        if (!user) {
            const passwordHash = await bcrypt.hash(ownerPassword || "Password123!", 10);
            user = await tx.user.create({
                data: {
                    email: ownerEmail,
                    passwordHash,
                    firstName: firstName || shopName,
                    lastName: lastName || "Vendor",
                    phone: phone || businessPhone,
                    status: "ACTIVE",
                    roleAssignments: {
                        create: { roleId: sellerRole.id }
                    }
                }
            });
        } else {
            // Ensure user has seller role
            const hasRole = await tx.userRoleAssignment.findUnique({
                where: {
                    userId_roleId: {
                        userId: user.id,
                        roleId: sellerRole.id
                    }
                }
            });

            if (!hasRole) {
                await tx.userRoleAssignment.create({
                    data: {
                        userId: user.id,
                        roleId: sellerRole.id
                    }
                });
            }
        }

        // Create Seller record
        const seller = await tx.seller.create({
            data: {
                userId: user.id,
                shopName,
                slug: finalSlug,
                description: description || null,
                businessEmail: businessEmail || ownerEmail,
                businessPhone: businessPhone || phone || null,
                logoUrl: logoUrl || null,
                bannerUrl: bannerUrl || null,
                status,
                verificationStatus,
                commissionRate: commissionRate ? Number(commissionRate) : null,
                wallet: {
                    create: {
                        balance: 0,
                        pendingBalance: 0,
                        withdrawableBalance: 0,
                    }
                },
                documents: Array.isArray(documents) && documents.length > 0 ? {
                    create: documents.map((d: any) => ({
                        type: d.type,
                        fileUrl: d.fileUrl,
                        notes: d.notes || null,
                        status: "APPROVED",
                        reviewedAt: new Date(),
                    }))
                } : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                wallet: true,
                documents: true,
            }
        });

        // Audit log
        await tx.auditLog.create({
            data: {
                userId: admin.id,
                action: "CREATE",
                entityType: "SELLER",
                entityId: seller.id,
                newData: {
                    shopName: seller.shopName,
                    slug: seller.slug,
                    status: seller.status,
                    ownerEmail: user.email,
                }
            }
        });

        return seller;
    });

    return {
        data: result,
        message: "Vendor created successfully."
    };
});
