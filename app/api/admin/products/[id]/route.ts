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
                    category: {
                        include: {
                            parent: {
                                include: {
                                    parent: true,
                                }
                            }
                        }
                    },
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
        include: {
            brand: true,
            categories: { include: { category: true } },
            images: { orderBy: { sortOrder: "asc" } },
            variants: true,
            seo: true,
        }
    });

    if (!existingProduct) {
        throw new AppError(404, "Product not found.");
    }

    const {
        name,
        slug,
        sku,
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

    const trimmedSku = typeof sku === "string" ? sku.trim() : undefined;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        throw new AppError(400, "Product name is required.");
    }

    if (slug !== undefined && (typeof slug !== "string" || !slug.trim())) {
        throw new AppError(400, "Product URL key is required.");
    }

    // Check SKU collision if SKU provided
    if (trimmedSku) {
        const skuConflict = await prisma.productVariant.findFirst({
            where: {
                sku: trimmedSku,
                productId: { not: id }
            }
        });
        if (skuConflict) {
            throw new AppError(409, `A product variant with SKU "${trimmedSku}" already exists.`);
        }
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

        // Handle Variants & SKU
        if (Array.isArray(variants)) {
            await tx.productVariant.deleteMany({
                where: { productId: id }
            });

            if (variants.length > 0) {
                const varList = [...variants];
                // If single variant and trimmedSku provided, enforce trimmedSku
                if (varList.length === 1 && trimmedSku) {
                    varList[0] = { ...varList[0], sku: trimmedSku };
                }
                for (const v of varList) {
                    await tx.productVariant.create({
                        data: {
                            productId: id,
                            name: v.name,
                            sku: v.sku || `${(slug || existingProduct.slug)}-${v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                        }
                    });
                }
            } else if (trimmedSku) {
                // If variants was empty array but a SKU was provided, create default variant
                await tx.productVariant.create({
                    data: {
                        productId: id,
                        name: "Default",
                        sku: trimmedSku,
                    }
                });
            }
        } else if (trimmedSku) {
            // Variants not explicitly posted in body, but SKU was changed
            const existingVariant = await tx.productVariant.findFirst({
                where: { productId: id },
                orderBy: { createdAt: "asc" }
            });
            if (existingVariant) {
                await tx.productVariant.update({
                    where: { id: existingVariant.id },
                    data: { sku: trimmedSku }
                });
            } else {
                await tx.productVariant.create({
                    data: {
                        productId: id,
                        name: "Default",
                        sku: trimmedSku,
                    }
                });
            }
        }

        // Also sync sellerListing sellerSku if trimmedSku was provided
        if (trimmedSku) {
            await tx.sellerListing.updateMany({
                where: { productId: id },
                data: { sellerSku: trimmedSku }
            });
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

        // Calculate detailed changed fields between existingProduct and product
        const diffs: Array<{
            field: string;
            label: string;
            oldValue: any;
            newValue: any;
            type?: "text" | "badge" | "list" | "images" | "number";
        }> = [];

        if (existingProduct.name !== product.name) {
            diffs.push({ field: "name", label: "Product Title", oldValue: existingProduct.name, newValue: product.name, type: "text" });
        }
        if (existingProduct.slug !== product.slug) {
            diffs.push({ field: "slug", label: "Slug / URL Key", oldValue: existingProduct.slug, newValue: product.slug, type: "text" });
        }

        const oldPrimarySku = existingProduct.variants?.[0]?.sku || (existingProduct as any).listings?.[0]?.sellerSku || null;
        const newPrimarySku = trimmedSku || product.variants?.[0]?.sku || oldPrimarySku;
        if (oldPrimarySku !== newPrimarySku && newPrimarySku) {
            diffs.push({
                field: "sku",
                label: "Product SKU",
                oldValue: oldPrimarySku || "None",
                newValue: newPrimarySku,
                type: "text",
            });
        }

        if (existingProduct.status !== product.status) {
            diffs.push({ field: "status", label: "Status", oldValue: existingProduct.status, newValue: product.status, type: "badge" });
        }
        if (existingProduct.visibility !== product.visibility) {
            diffs.push({ field: "visibility", label: "Visibility", oldValue: existingProduct.visibility, newValue: product.visibility, type: "badge" });
        }
        if (existingProduct.brandId !== product.brandId) {
            diffs.push({
                field: "brand",
                label: "Brand",
                oldValue: existingProduct.brand?.name || "None",
                newValue: product.brand?.name || "None",
                type: "text",
            });
        }
        if ((existingProduct.shortDescription || "") !== (product.shortDescription || "")) {
            diffs.push({
                field: "shortDescription",
                label: "Short Description",
                oldValue: existingProduct.shortDescription || "",
                newValue: product.shortDescription || "",
                type: "text",
            });
        }
        if ((existingProduct.description || "") !== (product.description || "")) {
            diffs.push({
                field: "description",
                label: "Full Description",
                oldValue: existingProduct.description ? `${existingProduct.description.slice(0, 80)}...` : "Empty",
                newValue: product.description ? `${product.description.slice(0, 80)}...` : "Empty",
                type: "text",
            });
        }
        if ((existingProduct.modelNumber || "") !== (product.modelNumber || "")) {
            diffs.push({ field: "modelNumber", label: "Model Number", oldValue: existingProduct.modelNumber || "None", newValue: product.modelNumber || "None", type: "text" });
        }
        if ((existingProduct.manufacturer || "") !== (product.manufacturer || "")) {
            diffs.push({ field: "manufacturer", label: "Manufacturer", oldValue: existingProduct.manufacturer || "None", newValue: product.manufacturer || "None", type: "text" });
        }
        if ((existingProduct.countryOfOrigin || "") !== (product.countryOfOrigin || "")) {
            diffs.push({ field: "countryOfOrigin", label: "Country of Origin", oldValue: existingProduct.countryOfOrigin || "None", newValue: product.countryOfOrigin || "None", type: "text" });
        }
        if (Number(existingProduct.weight || 0) !== Number(product.weight || 0)) {
            diffs.push({
                field: "weight",
                label: "Weight",
                oldValue: existingProduct.weight ? `${existingProduct.weight} kg` : "None",
                newValue: product.weight ? `${product.weight} kg` : "None",
                type: "number",
            });
        }

        // Compare categories
        const oldCatNames = existingProduct.categories.map((c: any) => c.category?.name || c.categoryId).sort();
        const newCatNames = product.categories.map((c: any) => c.category?.name || c.categoryId).sort();
        if (JSON.stringify(oldCatNames) !== JSON.stringify(newCatNames)) {
            diffs.push({
                field: "categories",
                label: "Categories",
                oldValue: oldCatNames,
                newValue: newCatNames,
                type: "list",
            });
        }

        // Compare images
        const oldImgUrls = existingProduct.images.map((img: any) => img.url).sort();
        const newImgUrls = product.images.map((img: any) => img.url).sort();
        if (JSON.stringify(oldImgUrls) !== JSON.stringify(newImgUrls) || existingProduct.images.length !== product.images.length) {
            diffs.push({
                field: "images",
                label: "Product Images",
                oldValue: existingProduct.images.map((img: any) => ({ url: img.url, isPrimary: img.isPrimary, altText: img.altText })),
                newValue: product.images.map((img: any) => ({ url: img.url, isPrimary: img.isPrimary, altText: img.altText })),
                type: "images",
            });
        }

        // Compare variants
        const oldVarNames = (existingProduct.variants || []).map((v: any) => v.name).sort();
        const newVarNames = (product.variants || []).map((v: any) => v.name).sort();
        if (JSON.stringify(oldVarNames) !== JSON.stringify(newVarNames)) {
            diffs.push({
                field: "variants",
                label: "Product Variants",
                oldValue: oldVarNames,
                newValue: newVarNames,
                type: "list",
            });
        }

        // Compare SEO
        if (seo) {
            const oldSeo = existingProduct.seo;
            const newSeo = product.seo;
            if (
                (oldSeo?.metaTitle || "") !== (newSeo?.metaTitle || "") ||
                (oldSeo?.metaDescription || "") !== (newSeo?.metaDescription || "")
            ) {
                diffs.push({
                    field: "seo",
                    label: "SEO Settings",
                    oldValue: oldSeo?.metaTitle || "None",
                    newValue: newSeo?.metaTitle || "None",
                    type: "text",
                });
            }
        }

        // Calculate next revision number
        const latestRev = await tx.productRevision.findFirst({
            where: { productId: id },
            orderBy: { revisionNumber: "desc" },
        });
        const nextRevNum = (latestRev?.revisionNumber || 0) + 1;

        // Compute human-readable summary
        let revSummary = `Catalog update applied (Rev #${nextRevNum})`;
        if (diffs.length > 0) {
            const labels = diffs.map((d) => d.label);
            if (labels.length <= 3) {
                revSummary = `Updated ${labels.join(", ")}`;
            } else {
                revSummary = `Updated ${labels.slice(0, 3).join(", ")} (+${labels.length - 3} more)`;
            }
        }

        // Record a Product Revision with rich snapshot & computed changes
        await tx.productRevision.create({
            data: {
                productId: id,
                revisionNumber: nextRevNum,
                status: "PUBLISHED",
                payload: {
                    snapshot: {
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        sku: newPrimarySku,
                        status: product.status,
                        visibility: product.visibility,
                        ownershipType: product.ownershipType,
                        productType: product.productType,
                        brand: product.brand ? { id: product.brand.id, name: product.brand.name } : null,
                        shortDescription: product.shortDescription,
                        description: product.description,
                        modelNumber: product.modelNumber,
                        manufacturer: product.manufacturer,
                        countryOfOrigin: product.countryOfOrigin,
                        weight: product.weight ? Number(product.weight) : null,
                        dimensions: {
                            length: product.length ? Number(product.length) : null,
                            width: product.width ? Number(product.width) : null,
                            height: product.height ? Number(product.height) : null,
                        },
                        categories: product.categories.map((c: any) => ({
                            id: c.categoryId,
                            name: c.category?.name || "Category",
                        })),
                        images: product.images.map((img: any) => ({
                            url: img.url,
                            altText: img.altText,
                            isPrimary: img.isPrimary,
                        })),
                        variants: product.variants.map((v: any) => ({
                            id: v.id,
                            name: v.name,
                            sku: v.sku,
                        })),
                        seo: product.seo ? {
                            metaTitle: product.seo.metaTitle,
                            metaDescription: product.seo.metaDescription,
                            metaKeywords: product.seo.metaKeywords,
                            canonicalUrl: product.seo.canonicalUrl,
                        } : null,
                    },
                    changes: diffs,
                    // Preserve direct top-level fields for legacy compatibility
                    name: product.name,
                    slug: product.slug,
                    status: product.status,
                    visibility: product.visibility,
                    ownershipType: product.ownershipType,
                    brandId: product.brandId,
                },
                summary: revSummary,
                createdById: admin.id,
                reviewedById: admin.id,
                publishedAt: new Date(),
            },
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
