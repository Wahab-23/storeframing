import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "sellers:verification:read");
    const verifications = await prisma.sellerDocument.findMany({
        where: { status: "PENDING" },
        include: { seller: { select: { shopName: true } } },
        orderBy: { createdAt: "desc" }
    });
    return { data: verifications };
});

export const POST = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "sellers:verification:write");
    const body = await request.json();
    const verification = await prisma.sellerDocument.update({
        where: { id: body.documentId },
        data: { status: body.status, notes: body.notes }
    });
    return { data: verification };
});
