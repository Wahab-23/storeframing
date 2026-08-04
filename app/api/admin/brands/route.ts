import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    const brands = await prisma.brand.findMany({
        orderBy: { name: "asc" }
    });

    return { data: brands };
});

export const POST = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "catalogue:brands:write");
    
    const body = await request.json();
    
    const brand = await prisma.brand.create({
        data: {
            name: body.name,
            slug: body.slug,
            description: body.description,
            logoUrl: body.logoUrl,
            isActive: body.isActive ?? true,
        }
    });

    return { data: brand, status: 201 };
});
