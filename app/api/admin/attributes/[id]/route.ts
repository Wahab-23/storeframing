import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

const attributeTypeValues = [
    "TEXT",
    "TEXTAREA",
    "INTEGER",
    "DECIMAL",
    "BOOLEAN",
    "DATE",
    "SELECT",
    "MULTI_SELECT",
    "COLOR",
] as const;

const attributeScopeValues = ["PRODUCT", "LISTING", "VARIANT"] as const;

const updateAttributeSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    code: z.string().trim().max(100).optional(),
    type: z.enum(attributeTypeValues).optional(),
    scope: z.enum(attributeScopeValues).optional(),
    isRequired: z.boolean().optional(),
    isFilterable: z.boolean().optional(),
    isSearchable: z.boolean().optional(),
    isVariant: z.boolean().optional(),
    values: z
        .array(
            z.object({
                id: z.string().optional(),
                label: z.string().trim().min(1),
                value: z.string().trim().min(1),
                sortOrder: z.number().int().optional(),
            })
        )
        .optional(),
    categoryIds: z.array(z.string()).optional(),
});

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;

    const attribute = await prisma.attribute.findUnique({
        where: { id },
        include: {
            values: {
                orderBy: { sortOrder: "asc" },
            },
            categories: {
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    productValues: true,
                    values: true,
                    categories: true,
                    variantValues: true,
                    listingValues: true,
                },
            },
        },
    });

    if (!attribute) {
        return error("Attribute not found", 404);
    }

    return success(attribute, "Attribute fetched successfully");
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requirePermission(request, [
        "catalogue:attributes:write",
        "admin:attributes:write",
        "admin:products:write",
    ]);

    const { id } = await context.params;
    const json = await request.json().catch(() => null);

    const parsed = updateAttributeSchema.safeParse(json);
    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.attribute.findUnique({
        where: { id },
        include: { values: true },
    });

    if (!existing) {
        return error("Attribute not found", 404);
    }

    const data = parsed.data;

    // Check code collision if code changed
    if (data.code && data.code !== existing.code) {
        const codeTaken = await prisma.attribute.findFirst({
            where: {
                code: data.code.toUpperCase(),
                NOT: { id },
            },
        });
        if (codeTaken) {
            return error(`Attribute code "${data.code}" is already in use by another attribute.`, 409);
        }
    }

    const updated = await prisma.$transaction(async (tx) => {
        // 1. Update core attribute fields
        const attr = await tx.attribute.update({
            where: { id },
            data: {
                name: data.name ?? undefined,
                code: data.code ? data.code.toUpperCase() : undefined,
                type: data.type ?? undefined,
                scope: data.scope ?? undefined,
                isRequired: data.isRequired ?? undefined,
                isFilterable: data.isFilterable ?? undefined,
                isSearchable: data.isSearchable ?? undefined,
                isVariant: data.isVariant ?? undefined,
            },
        });

        // 2. Synchronize values if provided
        if (data.values !== undefined) {
            // Delete removed values
            const providedIds = data.values.map((v) => v.id).filter(Boolean) as string[];
            await tx.attributeValue.deleteMany({
                where: {
                    attributeId: id,
                    NOT: { id: { in: providedIds } },
                },
            });

            // Upsert / update values
            for (let i = 0; i < data.values.length; i++) {
                const val = data.values[i];
                const sortOrder = val.sortOrder !== undefined ? val.sortOrder : i;

                if (val.id) {
                    await tx.attributeValue.update({
                        where: { id: val.id },
                        data: {
                            label: val.label,
                            value: val.value,
                            sortOrder,
                        },
                    });
                } else {
                    await tx.attributeValue.create({
                        data: {
                            attributeId: id,
                            label: val.label,
                            value: val.value,
                            sortOrder,
                        },
                    });
                }
            }
        }

        // 3. Synchronize categories if provided
        if (data.categoryIds !== undefined) {
            await tx.categoryAttribute.deleteMany({
                where: { attributeId: id },
            });

            if (data.categoryIds.length > 0) {
                await tx.categoryAttribute.createMany({
                    data: data.categoryIds.map((catId, index) => ({
                        attributeId: id,
                        categoryId: catId,
                        isRequired: data.isRequired ?? existing.isRequired,
                        isFilterable: data.isFilterable ?? existing.isFilterable,
                        isVariant: data.isVariant ?? existing.isVariant,
                        sortOrder: index,
                    })),
                });
            }
        }

        return tx.attribute.findUnique({
            where: { id },
            include: {
                values: {
                    orderBy: { sortOrder: "asc" },
                },
                categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        productValues: true,
                        values: true,
                        categories: true,
                        variantValues: true,
                        listingValues: true,
                    },
                },
            },
        });
    });

    return success(updated, "Attribute updated successfully");
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requirePermission(request, [
        "catalogue:attributes:write",
        "admin:attributes:write",
        "admin:products:write",
    ]);

    const { id } = await context.params;

    const existing = await prisma.attribute.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    productValues: true,
                    variantValues: true,
                    listingValues: true,
                },
            },
        },
    });

    if (!existing) {
        return error("Attribute not found", 404);
    }

    await prisma.attribute.delete({
        where: { id },
    });

    return success({ id }, "Attribute deleted successfully");
});
