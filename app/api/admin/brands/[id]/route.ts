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
    const { id } = await context.params;
    const brand = await prisma.brand.findUnique({
        where: { id }
    });

    if (!brand) {
        throw new AppError(404, "Brand not found");
    }

    return { data: brand };
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requirePermission(request, "catalogue:brands:write");
    const { id } = await context.params;
    
    const body = await request.json();
    
    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
        where: { id }
    });

    if (!existingBrand) {
        throw new AppError(404, "Brand not found");
    }

    const brand = await prisma.brand.update({
        where: { id },
        data: {
            name: body.name !== undefined ? body.name : undefined,
            slug: body.slug !== undefined ? body.slug : undefined,
            description: body.description !== undefined ? body.description : undefined,
            logoUrl: body.logoUrl !== undefined ? body.logoUrl : undefined,
            isActive: body.isActive !== undefined ? body.isActive : undefined,
        }
    });

    return { data: brand };
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requirePermission(request, "catalogue:brands:write");
    const { id } = await context.params;
    
    const existingBrand = await prisma.brand.findUnique({
        where: { id }
    });

    if (!existingBrand) {
        throw new AppError(404, "Brand not found");
    }

    await prisma.brand.delete({
        where: { id }
    });

    return { message: "Brand deleted successfully" };
});
