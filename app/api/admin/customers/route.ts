import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "customers:read");

    const customers = await prisma.user.findMany({
        where: {
            roleAssignments: {
                some: { role: { name: "CUSTOMER" } }
            }
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            status: true
        },
        orderBy: { createdAt: "desc" },
        take: 100
    });

    return { data: customers };
});
