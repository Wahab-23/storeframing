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
    const attribute = await prisma.attribute.findUnique({
        where: { id }
    });

    if (!attribute) {
        throw new AppError(404, "Attribute not found");
    }

    return { data: attribute };
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requirePermission(request, "catalogue:attributes:write");
    const { id } = await context.params;
    
    const body = await request.json();
    
    const existing = await prisma.attribute.findUnique({
        where: { id }
    });

    if (!existing) {
        throw new AppError(404, "Attribute not found");
    }

    const attribute = await prisma.attribute.update({
        where: { id },
        data: {
            name: body.name !== undefined ? body.name : undefined,
            code: body.code !== undefined ? body.code : undefined,
            type: body.type !== undefined ? body.type : undefined,
            scope: body.scope !== undefined ? body.scope : undefined,
            isRequired: body.isRequired !== undefined ? body.isRequired : undefined,
            isFilterable: body.isFilterable !== undefined ? body.isFilterable : undefined,
            isSearchable: body.isSearchable !== undefined ? body.isSearchable : undefined,
            isVariant: body.isVariant !== undefined ? body.isVariant : undefined,
        }
    });

    return { data: attribute };
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requirePermission(request, "catalogue:attributes:write");
    const { id } = await context.params;
    
    const existing = await prisma.attribute.findUnique({
        where: { id }
    });

    if (!existing) {
        throw new AppError(404, "Attribute not found");
    }

    await prisma.attribute.delete({
        where: { id }
    });

    return { message: "Attribute deleted successfully" };
});
