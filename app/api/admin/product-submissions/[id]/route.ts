import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { error, success } from "@/lib/api-response";
import { requirePermission } from "@/lib/admin/require-permission";
import { prisma } from "@/lib/prisma";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

const updateSubmissionSchema = z.object({
    title: z.string().trim().max(255).optional(),
    name: z.string().trim().max(255).optional(),
    slug: z.string().trim().max(255).optional(),
    sellerId: z.string().optional(),
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
        .optional(),
    rejectionReason: z.string().nullable().optional(),
    description: z.string().trim().max(10000).nullable().optional(),
    shortDescription: z.string().trim().max(5000).nullable().optional(),
    brandId: z.string().nullable().optional(),
    productType: z
        .enum(["SIMPLE", "VARIABLE", "DIGITAL", "VIRTUAL", "SERVICE", "BUNDLE"])
        .optional(),
    price: z.coerce.number().positive().optional(),
    compareAtPrice: z.coerce.number().positive().nullable().optional(),
    costPrice: z.coerce.number().positive().nullable().optional(),
    quantity: z.coerce.number().int().min(0).optional(),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
    condition: z.enum(["NEW", "USED", "REFURBISHED", "OPEN_BOX"]).optional(),
    sellerSku: z.string().trim().max(100).nullable().optional(),
    modelNumber: z.string().trim().max(255).nullable().optional(),
    manufacturer: z.string().trim().max(255).nullable().optional(),
    countryOfOrigin: z.string().trim().max(255).nullable().optional(),
    warrantyTitle: z.string().trim().max(255).nullable().optional(),
    warrantyDescription: z.string().trim().max(5000).nullable().optional(),
    categories: z.array(z.any()).optional(),
    images: z
        .array(
            z.object({
                url: z.string().trim().min(1),
                altText: z.string().trim().nullable().optional(),
                isPrimary: z.boolean().optional(),
                sortOrder: z.number().int().optional(),
            })
        )
        .optional(),
    attributes: z.array(z.any()).optional(),
    variants: z.array(z.any()).optional(),
});

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requirePermission(request, "admin:products:read");
    const { id } = await context.params;

    const submission = await prisma.productSubmission.findUnique({
        where: { id },
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
    });

    if (!submission) {
        return error("Product submission not found", 404);
    }

    return success(submission, "Product submission fetched successfully");
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await requirePermission(request, "admin:products:write");
    const { id } = await context.params;

    const existing = await prisma.productSubmission.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            status: true,
            payload: true,
            sellerId: true,
        },
    });

    if (!existing) {
        return error("Product submission not found", 404);
    }

    const json = await request.json().catch(() => null);
    const parsed = updateSubmissionSchema.safeParse(json);
    if (!parsed.success) {
        return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;
    const currentPayload = (existing.payload as Record<string, any>) || {};

    const updatedName = data.name ?? data.title ?? currentPayload.name ?? existing.title;
    let updatedSlug = data.slug ?? currentPayload.slug;
    if (!updatedSlug && updatedName) {
        updatedSlug = updatedName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    const categoriesFormatted = data.categories
        ? data.categories.map((c: any) =>
              typeof c === "string" ? { categoryId: c } : { categoryId: c.categoryId || c.id }
          )
        : currentPayload.categories;

    const mergedPayload = {
        ...currentPayload,
        ...(updatedName ? { name: updatedName } : {}),
        ...(updatedSlug ? { slug: updatedSlug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.shortDescription !== undefined ? { shortDescription: data.shortDescription } : {}),
        ...(data.brandId !== undefined ? { brandId: data.brandId } : {}),
        ...(data.productType !== undefined ? { productType: data.productType } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.compareAtPrice !== undefined ? { compareAtPrice: data.compareAtPrice } : {}),
        ...(data.costPrice !== undefined ? { costPrice: data.costPrice } : {}),
        ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
        ...(data.lowStockThreshold !== undefined ? { lowStockThreshold: data.lowStockThreshold } : {}),
        ...(data.condition !== undefined ? { condition: data.condition } : {}),
        ...(data.sellerSku !== undefined ? { sellerSku: data.sellerSku } : {}),
        ...(data.modelNumber !== undefined ? { modelNumber: data.modelNumber } : {}),
        ...(data.manufacturer !== undefined ? { manufacturer: data.manufacturer } : {}),
        ...(data.countryOfOrigin !== undefined ? { countryOfOrigin: data.countryOfOrigin } : {}),
        ...(data.warrantyTitle !== undefined ? { warrantyTitle: data.warrantyTitle } : {}),
        ...(data.warrantyDescription !== undefined ? { warrantyDescription: data.warrantyDescription } : {}),
        ...(categoriesFormatted !== undefined ? { categories: categoriesFormatted } : {}),
        ...(data.images !== undefined ? { images: data.images } : {}),
        ...(data.attributes !== undefined ? { attributes: data.attributes } : {}),
        ...(data.variants !== undefined ? { variants: data.variants } : {}),
    };

    const updated = await prisma.productSubmission.update({
        where: { id },
        data: {
            title: updatedName,
            ...(data.sellerId ? { sellerId: data.sellerId } : {}),
            ...(data.status ? { status: data.status } : {}),
            ...(data.rejectionReason !== undefined ? { rejectionReason: data.rejectionReason } : {}),
            payload: mergedPayload as any,
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
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });

    return success(updated, "Product submission updated successfully");
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requirePermission(request, "admin:products:write");
    const { id } = await context.params;

    const existing = await prisma.productSubmission.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!existing) {
        return error("Product submission not found", 404);
    }

    await prisma.productSubmission.delete({
        where: { id },
    });

    return success({ id }, "Product submission deleted successfully");
});
