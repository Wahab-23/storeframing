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
    where: { id },
    include: {
      seo: true,
      _count: {
        select: {
          products: true,
        },
      },
      products: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
          ownerSeller: {
            select: {
              id: true,
              shopName: true,
            },
          },
          variants: {
            select: {
              id: true,
              sku: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!brand) {
    throw new AppError(404, "Brand not found");
  }

  return { data: brand };
});

export const PATCH = withApiHandler(async (request: NextRequest, context: RouteContext) => {
  await requirePermission(request, [
    "catalogue:brands:write",
    "admin:brands:write",
    "admin:products:write",
  ]);

  const { id } = await context.params;
  const body = await request.json();

  const existingBrand = await prisma.brand.findUnique({
    where: { id },
    include: { seo: true },
  });

  if (!existingBrand) {
    throw new AppError(404, "Brand not found");
  }

  const {
    name,
    slug,
    description,
    logoUrl,
    bannerUrl,
    websiteUrl,
    isFeatured,
    sortOrder,
    isActive,
    seo,
    productIds,
  } = body;

  let cleanSlug: string | undefined = undefined;
  if (slug !== undefined) {
    cleanSlug = String(slug)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!cleanSlug) {
      throw new AppError(400, "Invalid brand slug.");
    }

    if (cleanSlug !== existingBrand.slug) {
      const slugConflict = await prisma.brand.findUnique({
        where: { slug: cleanSlug },
      });
      if (slugConflict && slugConflict.id !== id) {
        throw new AppError(400, `A brand with slug "${cleanSlug}" already exists.`);
      }
    }
  }

  const updatedBrand = await prisma.$transaction(async (tx) => {
    const brand = await tx.brand.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(cleanSlug !== undefined ? { slug: cleanSlug } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(bannerUrl !== undefined ? { bannerUrl } : {}),
        ...(websiteUrl !== undefined ? { websiteUrl } : {}),
        ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) || 0 } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    // Handle SEO metadata
    if (seo !== undefined) {
      const hasSeoValues =
        seo &&
        typeof seo === "object" &&
        Object.values(seo).some(
          (val) => val !== null && val !== undefined && String(val).trim() !== ""
        );

      if (hasSeoValues) {
        const seoData = {
          metaTitle: seo.metaTitle ? String(seo.metaTitle).trim() : null,
          metaDescription: seo.metaDescription ? String(seo.metaDescription).trim() : null,
          metaKeywords: seo.metaKeywords ? String(seo.metaKeywords).trim() : null,
          canonicalUrl: seo.canonicalUrl ? String(seo.canonicalUrl).trim() : null,
          ogTitle: seo.ogTitle ? String(seo.ogTitle).trim() : null,
          ogDescription: seo.ogDescription ? String(seo.ogDescription).trim() : null,
          ogImageUrl: seo.ogImageUrl ? String(seo.ogImageUrl).trim() : null,
          robots: seo.robots ? String(seo.robots).trim() : null,
        };

        if (existingBrand.seo) {
          await tx.seoMetadata.update({
            where: { id: existingBrand.seo.id },
            data: seoData,
          });
        } else {
          await tx.seoMetadata.create({
            data: {
              brandId: id,
              ...seoData,
            },
          });
        }
      } else if (existingBrand.seo) {
        // If SEO was emptied, remove existing record
        await tx.seoMetadata.delete({
          where: { id: existingBrand.seo.id },
        });
      }
    }

    // Handle product tagging
    if (Array.isArray(productIds)) {
      // 1. Detach products currently assigned to this brand that are not in productIds
      await tx.product.updateMany({
        where: {
          brandId: id,
          id: { notIn: productIds },
        },
        data: {
          brandId: null,
        },
      });

      // 2. Attach selected products to this brand
      if (productIds.length > 0) {
        await tx.product.updateMany({
          where: {
            id: { in: productIds },
          },
          data: {
            brandId: id,
          },
        });
      }
    }

    return brand;
  });

  return { data: updatedBrand };
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
  await requirePermission(request, [
    "catalogue:brands:write",
    "admin:brands:write",
    "admin:products:write",
  ]);

  const { id } = await context.params;

  const existingBrand = await prisma.brand.findUnique({
    where: { id },
  });

  if (!existingBrand) {
    throw new AppError(404, "Brand not found");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Safely unlink all products (never delete master products)
    await tx.product.updateMany({
      where: { brandId: id },
      data: { brandId: null },
    });

    // 2. Delete SEO metadata if attached
    await tx.seoMetadata.deleteMany({
      where: { brandId: id },
    });

    // 3. Delete the brand
    await tx.brand.delete({
      where: { id },
    });
  });

  return { message: "Brand deleted successfully" };
});
