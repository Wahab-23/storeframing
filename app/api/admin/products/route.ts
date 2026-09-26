import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requirePermission } from "@/lib/admin/require-permission";
import { listAdminProducts } from "@/lib/admin/list-products";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "admin:products:read");

    const query = Object.fromEntries(request.nextUrl.searchParams);

    return listAdminProducts({
        query,
    });
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const admin = await requirePermission(request, "admin:products:write");
    const body = await request.json();

    const {
        name,
        slug,
        shortDescription,
        description,
        brandId,
        categoryIds = [],
        ownershipType = "PLATFORM",
        ownerSellerId,
        productType = "SIMPLE",
        status = "ACTIVE",
        visibility = "VISIBLE",
        modelNumber,
        manufacturer,
        countryOfOrigin,
        weight,
        length,
        width,
        height,
        images = [],
        seo,
        variants = [],
    } = body;

    if (typeof name !== "string" || !name.trim()) {
        throw new AppError(400, "Product name is required.");
    }

    if (ownershipType === "SELLER_EXCLUSIVE" && !ownerSellerId) {
        throw new AppError(400, "An exclusive product must have an owner seller.");
    }

    const finalSlug = (slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const existing = await prisma.product.findUnique({
        where: { slug: finalSlug }
    });

    if (existing) {
        throw new AppError(409, `A product with slug "${finalSlug}" already exists.`);
    }

    const product = await prisma.$transaction(async (tx) => {
        const newProduct = await tx.product.create({
            data: {
                name: name.trim(),
                slug: finalSlug,
                shortDescription: shortDescription || null,
                description: description || null,
                brandId: brandId || null,
                ownershipType,
                ownerSellerId: ownerSellerId || null,
                productType,
                status,
                visibility,
                modelNumber: modelNumber || null,
                manufacturer: manufacturer || null,
                countryOfOrigin: countryOfOrigin || null,
                weight: weight ? Number(weight) : null,
                length: length ? Number(length) : null,
                width: width ? Number(width) : null,
                height: height ? Number(height) : null,
                createdById: admin.id,
                categories: Array.isArray(categoryIds) && categoryIds.length > 0 ? {
                    create: categoryIds.map((catId: string) => ({
                        categoryId: catId
                    }))
                } : undefined,
                images: Array.isArray(images) && images.length > 0 ? {
                    create: images.map((img: any, idx: number) => ({
                        url: typeof img === "string" ? img : img.url,
                        altText: img.altText || name,
                        isPrimary: typeof img === "object" ? !!img.isPrimary : idx === 0,
                        sortOrder: idx,
                    }))
                } : undefined,
            },
            include: {
                brand: true,
                categories: {
                    include: { category: true }
                },
                images: true,
            }
        });

        // Create SEO Metadata if provided
        if (seo) {
            await tx.seoMetadata.create({
                data: {
                    productId: newProduct.id,
                    metaTitle: seo.metaTitle || null,
                    metaDescription: seo.metaDescription || null,
                    metaKeywords: seo.metaKeywords || null,
                    canonicalUrl: seo.canonicalUrl || null,
                }
            });
        }

        // Create Variants if Configurable
        if (Array.isArray(variants) && variants.length > 0) {
            for (const v of variants) {
                await tx.productVariant.create({
                    data: {
                        productId: newProduct.id,
                        name: v.name,
                        sku: v.sku || `${finalSlug}-${v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                    }
                });
            }
        }

        // Create Initial Product Revision #1
        await tx.productRevision.create({
            data: {
                productId: newProduct.id,
                revisionNumber: 1,
                status: "PUBLISHED",
                payload: {
                    snapshot: {
                        id: newProduct.id,
                        name: newProduct.name,
                        slug: newProduct.slug,
                        status: newProduct.status,
                        visibility: newProduct.visibility,
                        ownershipType: newProduct.ownershipType,
                        brandId: newProduct.brandId,
                        shortDescription: newProduct.shortDescription,
                        description: newProduct.description,
                        modelNumber: newProduct.modelNumber,
                        manufacturer: newProduct.manufacturer,
                        countryOfOrigin: newProduct.countryOfOrigin,
                        weight: newProduct.weight ? Number(newProduct.weight) : null,
                    },
                    name: newProduct.name,
                    slug: newProduct.slug,
                    status: newProduct.status,
                    ownershipType: newProduct.ownershipType,
                },
                summary: "Initial product creation in master catalogue",
                createdById: admin.id,
                reviewedById: admin.id,
                publishedAt: new Date(),
            }
        });

        await tx.auditLog.create({
            data: {
                userId: admin.id,
                action: "CREATE",
                entityType: "PRODUCT",
                entityId: newProduct.id,
                newData: {
                    name: newProduct.name,
                    slug: newProduct.slug,
                    status: newProduct.status,
                    ownershipType: newProduct.ownershipType,
                }
            }
        });

        return newProduct;
    });

    return {
        data: product,
        message: "Product created successfully."
    };
});
