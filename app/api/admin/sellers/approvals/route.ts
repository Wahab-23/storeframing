import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:sellers:read");

    const statusParam = request.nextUrl.searchParams.get("status") || "PENDING";

    const where = statusParam === "ALL"
        ? {
            OR: [
                { status: "PENDING" as const },
                { verificationStatus: "PENDING" as const }
            ]
        }
        : {
            status: statusParam as any
        };

    const approvals = await prisma.seller.findMany({
        where,
        select: {
            id: true,
            shopName: true,
            slug: true,
            description: true,
            businessEmail: true,
            businessPhone: true,
            status: true,
            verificationStatus: true,
            trustBadge: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                }
            },
            documents: {
                select: {
                    id: true,
                    type: true,
                    fileUrl: true,
                    status: true,
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return { data: approvals };
});
