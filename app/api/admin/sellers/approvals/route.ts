import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "sellers:approvals:read");
    const approvals = await prisma.seller.findMany({
        where: { verificationStatus: "PENDING" },
        orderBy: { createdAt: "desc" }
    });
    return { data: approvals };
});
