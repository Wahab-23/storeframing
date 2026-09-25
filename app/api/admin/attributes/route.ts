import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";

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

const createAttributeSchema = z.object({
    name: z.string().trim().min(1, "Attribute name is required").max(100),
    code: z.string().trim().max(100).optional(),
    type: z.enum(attributeTypeValues).default("TEXT"),
    scope: z.enum(attributeScopeValues).default("PRODUCT"),
    isRequired: z.boolean().default(false),
    isFilterable: z.boolean().default(false),
    isSearchable: z.boolean().default(false),
    isVariant: z.boolean().default(false),
    values: z
        .array(
            z.object({
                label: z.string().trim().min(1),
                value: z.string().trim().min(1),
                sortOrder: z.number().int().optional(),
            })
        )
        .optional()
        .default([]),
    categoryIds: z.array(z.string()).optional().default([]),
});

export const GET = withApiHandler(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type");
    const scope = searchParams.get("scope");

    const where: any = {};

    if (search) {
        where.OR = [
            { name: { contains: search } },
            { code: { contains: search } },
        ];
    }

    if (type && type !== "ALL") {
        where.type = type;
    }

    if (scope && scope !== "ALL") {
        where.scope = scope;
    }

    const attributes = await prisma.attribute.findMany({
        where,
        orderBy: { name: "asc" },
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
                },
            },
        },
    });

    return success(attributes, "Attributes fetched successfully");
});

export const POST = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, [
        "catalogue:attributes:write",
        "admin:attributes:write",
        "admin:products:write",
    ]);

    const json = await request.json().catch(() => null);
    const parsed = createAttributeSchema.safeParse(json);

    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;

    // Generate or clean code
    let finalCode = (data.code || data.name)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/(^_|_$)+/g, "");

    if (!finalCode) {
        finalCode = `ATTR_${Date.now()}`;
    }

    // Check duplicate code
    const existingCode = await prisma.attribute.findUnique({
        where: { code: finalCode },
    });

    if (existingCode) {
        return error(`Attribute code "${finalCode}" is already in use. Please choose another code.`, 409);
    }

    const attribute = await prisma.$transaction(async (tx) => {
        const created = await tx.attribute.create({
            data: {
                name: data.name,
                code: finalCode,
                type: data.type,
                scope: data.scope,
                isRequired: data.isRequired,
                isFilterable: data.isFilterable,
                isSearchable: data.isSearchable,
                isVariant: data.isVariant,
            },
        });

        // Insert predefined values
        if (data.values && data.values.length > 0) {
            await tx.attributeValue.createMany({
                data: data.values.map((v, index) => ({
                    attributeId: created.id,
                    label: v.label,
                    value: v.value || v.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    sortOrder: v.sortOrder !== undefined ? v.sortOrder : index,
                })),
            });
        }

        // Link categories
        if (data.categoryIds && data.categoryIds.length > 0) {
            await tx.categoryAttribute.createMany({
                data: data.categoryIds.map((catId, index) => ({
                    attributeId: created.id,
                    categoryId: catId,
                    isRequired: data.isRequired,
                    isFilterable: data.isFilterable,
                    isVariant: data.isVariant,
                    sortOrder: index,
                })),
            });
        }

        return tx.attribute.findUnique({
            where: { id: created.id },
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
                    },
                },
            },
        });
    });

    return success(attribute, "Attribute created successfully", 201);
});
