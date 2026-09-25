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
    await requirePermission(request, "admin:products:read");
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            brand: true,
            seo: true,
            categories: {
                include: {
                    category: true,
                }
            },
            images: {
                orderBy: { sortOrder: "asc" }
            },
            ownerSeller: {
                select: {
                    id: true,
                    shopName: true,
                    slug: true,
                }
            },
            listings: {
                include: {
                    seller: {
                        select: {
                            id: true,
                            shopName: true,
                            slug: true,
                        }
                    },
                    inventory: true,
                }
            },
            variants: {
                include: {
                    attributes: {
                        include: {
                            attribute: true,
                            attributeValue: true,
                        }
                    }
                }
            },
            productRevisions: {
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        }
                    }
                },
                orderBy: { revisionNumber: "desc" },
                take: 20,
            },
            _count: {
                select: {
                    reviews: true,
                    listings: true,
                    orderItems: true,
                }
            }
        }
    });

    if (!product) {
        throw new AppError(404, "Product not found.");
    }

    // Fetch related security audit logs
    const auditLogs = await prisma.auditLog.findMany({
        where: {
            entityType: "PRODUCT",
            entityId: id,
        },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                }
            }
        },
        orderBy: { createdAt: "desc" },
        take: 30,
    });

    return {
        data: {
            ...product,
            auditLogs,
        },
        message: "Product retrieved successfully."
    };
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await requirePermission(request, "admin:products:write");
    const { id } = await context.params;
    const body = await request.json();

    const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: { categories: true, images: true, seo: true }
    });

    if (!existingProduct) {
        throw new AppError(404, "Product not found.");
    }

    const {
        name,
        slug,
        shortDescription,
        description,
        brandId,
        categoryIds,
        ownershipType,
        ownerSellerId,
        productType,
        status,
        visibility,
        modelNumber,
        manufacturer,
        countryOfOrigin,
        weight,
        length,
        width,
        height,
        images,
        seo,
        variants,
    } = body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        throw new AppError(400, "Product name is required.");
    }

    if (slug !== undefined && (typeof slug !== "string" || !slug.trim())) {
        throw new AppError(400, "Product URL key is required.");
    }

    const nextOwnershipType = ownershipType ?? existingProduct.ownershipType;
    const nextOwnerSellerId = ownerSellerId !== undefined
        ? ownerSellerId
        : existingProduct.ownerSellerId;
    if (nextOwnershipType === "SELLER_EXCLUSIVE" && !nextOwnerSellerId) {
        throw new AppError(400, "An exclusive product must have an owner seller.");
    }

    // Check slug collision if changing slug
    if (slug && slug !== existingProduct.slug) {
        const slugExists = await prisma.product.findFirst({
            where: { slug, id: { not: id } }
        });
        if (slugExists) {
            throw new AppError(409, `A product with slug "${slug}" already exists.`);
        }
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
        // Handle Categories update if categoryIds provided
        if (Array.isArray(categoryIds)) {
            await tx.productCategory.deleteMany({
                where: { productId: id }
            });

            if (categoryIds.length > 0) {
                await tx.productCategory.createMany({
                    data: categoryIds.map((catId: string) => ({
                        productId: id,
                        categoryId: catId,
                    }))
                });
            }
        }

        // Handle Images update if images array provided
        if (Array.isArray(images)) {
            await tx.productImage.deleteMany({
                where: { productId: id }
            });

            if (images.length > 0) {
                await tx.productImage.createMany({
                    data: images.map((img: any, idx: number) => ({
                        productId: id,
                        url: typeof img === "string" ? img : img.url,
                        altText: img.altText || (name || existingProduct.name),
                        isPrimary: typeof img === "object" ? !!img.isPrimary : idx === 0,
                        sortOrder: idx,
                    }))
                });
            }
        }

        // Handle SEO Metadata
        if (seo) {
            await tx.seoMetadata.upsert({
                where: { productId: id },
                create: {
                    productId: id,
                    metaTitle: seo.metaTitle || null,
                    metaDescription: seo.metaDescription || null,
                    metaKeywords: seo.metaKeywords || null,
                    canonicalUrl: seo.canonicalUrl || null,
                },
                update: {
                    metaTitle: seo.metaTitle !== undefined ? (seo.metaTitle || null) : undefined,
                    metaDescription: seo.metaDescription !== undefined ? (seo.metaDescription || null) : undefined,
                    metaKeywords: seo.metaKeywords !== undefined ? (seo.metaKeywords || null) : undefined,
                    canonicalUrl: seo.canonicalUrl !== undefined ? (seo.canonicalUrl || null) : undefined,
                }
            });
        }

        // Handle Variants if Configurable
        if (Array.isArray(variants)) {
            await tx.productVariant.deleteMany({
                where: { productId: id }
            });

            if (variants.length > 0) {
                for (const v of variants) {
                    await tx.productVariant.create({
                        data: {
                            productId: id,
                            name: v.name,
                            sku: v.sku || `${(slug || existingProduct.slug)}-${v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                        }
                    });
                }
            }
        }

        // Update Product Fields
        const product = await tx.product.update({
            where: { id },
            data: {
                name: name !== undefined ? name.trim() : undefined,
                slug: slug !== undefined ? slug.trim() : undefined,
                shortDescription: shortDescription !== undefined ? shortDescription : undefined,
                description: description !== undefined ? description : undefined,
                brandId: brandId !== undefined ? (brandId || null) : undefined,
                ownershipType: ownershipType ?? undefined,
                ownerSellerId: ownerSellerId !== undefined ? (ownerSellerId || null) : undefined,
                productType: productType ?? undefined,
                status: status ?? undefined,
                visibility: visibility ?? undefined,
                modelNumber: modelNumber !== undefined ? (modelNumber || null) : undefined,
                manufacturer: manufacturer !== undefined ? (manufacturer || null) : undefined,
                countryOfOrigin: countryOfOrigin !== undefined ? (countryOfOrigin || null) : undefined,
                weight: weight !== undefined ? (weight ? Number(weight) : null) : undefined,
                length: length !== undefined ? (length ? Number(length) : null) : undefined,
                width: width !== undefined ? (width ? Number(width) : null) : undefined,
                height: height !== undefined ? (height ? Number(height) : null) : undefined,
            },
            include: {
                brand: true,
                seo: true,
                categories: {
                    include: { category: true }
                },
                images: {
                    orderBy: { sortOrder: "asc" }
                },
                variants: true,
                ownerSeller: true,
            }
        });

        // Record a Product Revision for History Tracking
        const latestRev = await tx.productRevision.findFirst({
            where: { productId: id },
            orderBy: { revisionNumber: "desc" }
        });
        const nextRevNum = (latestRev?.revisionNumber || 0) + 1;
        await tx.productRevision.create({
            data: {
                productId: id,
                revisionNumber: nextRevNum,
                status: "PUBLISHED",
                payload: {
                    name: product.name,
                    status: product.status,
                    visibility: product.visibility,
                    ownershipType: product.ownershipType,
                    brandId: product.brandId,
                },
                summary: `Updated product properties and catalogue settings (Rev #${nextRevNum})`,
                createdById: admin.id,
                reviewedById: admin.id,
                publishedAt: new Date(),
            }
        });

        // Record Audit Log
        await tx.auditLog.create({
            data: {
                userId: admin.id,
                action: "UPDATE",
                entityType: "PRODUCT",
                entityId: id,
                oldData: {
                    name: existingProduct.name,
                    slug: existingProduct.slug,
                    status: existingProduct.status,
                    ownershipType: existingProduct.ownershipType,
                },
                newData: {
                    name: product.name,
                    slug: product.slug,
                    status: product.status,
                    ownershipType: product.ownershipType,
                }
            }
        });

        return product;
    });

    return {
        data: updatedProduct,
        message: "Product updated successfully."
    };
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const admin = await requirePermission(request, "admin:products:write");
    const { id } = await context.params;

    const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: { _count: { select: { orderItems: true } } }
    });

    if (!existingProduct) {
        throw new AppError(404, "Product not found.");
    }

    if (existingProduct._count.orderItems > 0) {
        await prisma.product.update({
            where: { id },
            data: {
                status: "ARCHIVED",
                visibility: "HIDDEN",
                deletedAt: new Date(),
            }
        });
    } else {
        await prisma.product.delete({
            where: { id }
        });
    }

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: "DELETE",
            entityType: "PRODUCT",
            entityId: id,
            oldData: {
                name: existingProduct.name,
                slug: existingProduct.slug,
                status: existingProduct.status,
            }
        }
    });

    return {
        data: { id },
        message: "Product deleted or archived successfully."
    };
});
