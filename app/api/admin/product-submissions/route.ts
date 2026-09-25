import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";
import { requirePermission } from "@/lib/admin/require-permission";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
        .enum([
            "ALL",
            "DRAFT",
            "SUBMITTED",
            "PENDING_REVIEW",
            "UNDER_REVIEW",
            "APPROVED",
            "REJECTED",
            "RESUBMITTED",
        ])
        .optional(),
    search: z.string().trim().optional(),
});

const createSubmissionSchema = z.object({
    sellerId: z.string().min(1, "Seller is required"),
    name: z.string().trim().min(1, "Product name is required").max(255),
    slug: z.string().trim().max(255).optional(),
    description: z.string().trim().max(10000).nullable().optional(),
    shortDescription: z.string().trim().max(5000).nullable().optional(),
    brandId: z.string().nullable().optional(),
    productType: z
        .enum(["SIMPLE", "VARIABLE", "DIGITAL", "VIRTUAL", "SERVICE", "BUNDLE"])
        .default("SIMPLE"),
    price: z.coerce.number().positive("Price must be greater than 0"),
    compareAtPrice: z.coerce.number().positive().nullable().optional(),
    costPrice: z.coerce.number().positive().nullable().optional(),
    quantity: z.coerce.number().int().min(0).default(0),
    lowStockThreshold: z.coerce.number().int().min(0).default(5),
    condition: z.enum(["NEW", "USED", "REFURBISHED", "OPEN_BOX"]).default("NEW"),
    sellerSku: z.string().trim().max(100).nullable().optional(),
    modelNumber: z.string().trim().max(255).nullable().optional(),
    manufacturer: z.string().trim().max(255).nullable().optional(),
    countryOfOrigin: z.string().trim().max(255).nullable().optional(),
    warrantyTitle: z.string().trim().max(255).nullable().optional(),
    warrantyDescription: z.string().trim().max(5000).nullable().optional(),
    categories: z.array(z.any()).optional().default([]),
    images: z
        .array(
            z.object({
                url: z.string().trim().min(1),
                altText: z.string().trim().nullable().optional(),
                isPrimary: z.boolean().optional(),
                sortOrder: z.number().int().optional(),
            })
        )
        .optional()
        .default([]),
    attributes: z.array(z.any()).optional().default([]),
    variants: z.array(z.any()).optional().default([]),
    status: z
        .enum([
            "DRAFT",
            "SUBMITTED",
            "PENDING_REVIEW",
            "UNDER_REVIEW",
            "APPROVED",
            "REJECTED",
            "RESUBMITTED",
        ])
        .default("PENDING_REVIEW"),
});

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:products:read");

    const parsed = querySchema.safeParse({
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        status: request.nextUrl.searchParams.get("status") ?? undefined,
        search: request.nextUrl.searchParams.get("search") ?? undefined,
    });

    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const where: any = {};
    if (parsed.data.status && parsed.data.status !== "ALL") {
        where.status = parsed.data.status;
    }

    if (parsed.data.search) {
        where.OR = [
            { title: { contains: parsed.data.search } },
            { seller: { shopName: { contains: parsed.data.search } } },
            { product: { name: { contains: parsed.data.search } } },
        ];
    }

    const [submissions, total] = await prisma.$transaction([
        prisma.productSubmission.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (parsed.data.page - 1) * parsed.data.limit,
            take: parsed.data.limit,
            select: {
                id: true,
                title: true,
                status: true,
                rejectionReason: true,
                submittedAt: true,
                reviewedAt: true,
                createdAt: true,
                updatedAt: true,
                productId: true,
                payload: true,
                seller: {
                    select: {
                        id: true,
                        shopName: true,
                        slug: true,
                        status: true,
                    },
                },
                reviewedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        }),
        prisma.productSubmission.count({ where }),
    ]);

    return success(
        {
            submissions,
            pagination: {
                page: parsed.data.page,
                limit: parsed.data.limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / parsed.data.limit)),
            },
        },
        "Product submissions fetched successfully"
    );
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const admin = await requirePermission(request, "admin:products:write");
    const json = await request.json().catch(() => null);

    const parsed = createSubmissionSchema.safeParse(json);
    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;

    // Verify seller exists
    const seller = await prisma.seller.findUnique({
        where: { id: data.sellerId },
        select: { id: true, shopName: true, status: true },
    });

    if (!seller) {
        return error("Selected seller not found", 404);
    }

    const baseSlug = (data.slug || data.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `submission-${Date.now()}`;

    const categoriesFormatted = (data.categories || []).map((c: any) =>
        typeof c === "string" ? { categoryId: c } : { categoryId: c.categoryId || c.id }
    );

    const payload = {
        name: data.name,
        slug: baseSlug,
        description: data.description || null,
        shortDescription: data.shortDescription || null,
        brandId: data.brandId || null,
        productType: data.productType,
        price: data.price,
        compareAtPrice: data.compareAtPrice ?? null,
        costPrice: data.costPrice ?? null,
        quantity: data.quantity,
        lowStockThreshold: data.lowStockThreshold,
        condition: data.condition,
        sellerSku: data.sellerSku || null,
        modelNumber: data.modelNumber || null,
        manufacturer: data.manufacturer || null,
        countryOfOrigin: data.countryOfOrigin || null,
        warrantyTitle: data.warrantyTitle || null,
        warrantyDescription: data.warrantyDescription || null,
        categories: categoriesFormatted,
        images: data.images || [],
        attributes: data.attributes || [],
        variants: data.variants || [],
    };

    const submission = await prisma.productSubmission.create({
        data: {
            sellerId: data.sellerId,
            title: data.name,
            payload: payload as any,
            status: data.status,
            submittedAt: new Date(),
            reviewedById: admin.id,
        },
        include: {
            seller: {
                select: {
                    id: true,
                    shopName: true,
                    slug: true,
                    status: true,
                },
            },
            reviewedBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });

    return success(submission, "Product submission created successfully", 201);
});

