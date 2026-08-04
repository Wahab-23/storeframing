import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    const attributes = await prisma.attribute.findMany({
        orderBy: { name: "asc" }
    });

    return { data: attributes };
});

export const POST = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "catalogue:attributes:write");
    
    const body = await request.json();
    
    const attribute = await prisma.attribute.create({
        data: {
            name: body.name,
            code: body.code,
            type: body.type,
            scope: body.scope,
            isRequired: body.isRequired,
            isFilterable: body.isFilterable,
            isSearchable: body.isSearchable,
            isVariant: body.isVariant,
        }
    });

    return { data: attribute, status: 201 };
});
