import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

export const GET = withApiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || searchParams.get("q") || "";
  const status = searchParams.get("status");
  const isFeatured = searchParams.get("isFeatured");

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
    ];
  }

  if (status === "ACTIVE") {
    where.isActive = true;
  } else if (status === "INACTIVE") {
    where.isActive = false;
  }

  if (isFeatured === "true") {
    where.isFeatured = true;
  } else if (isFeatured === "false") {
    where.isFeatured = false;
  }

  const brands = await prisma.brand.findMany({
    where,
    include: {
      seo: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: [
      { isFeatured: "desc" },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });

  return { data: brands };
});

export const POST = withApiHandler(async (request: NextRequest) => {
  await requirePermission(request, [
    "catalogue:brands:write",
    "admin:brands:write",
    "admin:products:write",
  ]);

  const body = await request.json();
  const {
    name,
    slug,
    description,
    logoUrl,
    bannerUrl,
    websiteUrl,
    isFeatured = false,
    sortOrder = 0,
    isActive = true,
    seo,
    productIds = [],
  } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new AppError(400, "Brand name is required.");
  }

  const cleanSlug = (slug || name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  if (!cleanSlug) {
    throw new AppError(400, "Invalid brand slug.");
  }

  const existingSlug = await prisma.brand.findUnique({
    where: { slug: cleanSlug },
  });

  if (existingSlug) {
    throw new AppError(400, `A brand with slug "${cleanSlug}" already exists.`);
  }

  const hasSeoValues =
    seo &&
    typeof seo === "object" &&
    Object.values(seo).some(
      (val) => val !== null && val !== undefined && String(val).trim() !== ""
    );

  const brand = await prisma.$transaction(async (tx) => {
    const createdBrand = await tx.brand.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        description: description || null,
        logoUrl: logoUrl || null,
        bannerUrl: bannerUrl || null,
        websiteUrl: websiteUrl || null,
        isFeatured: Boolean(isFeatured),
        sortOrder: Number(sortOrder) || 0,
        isActive: isActive !== false,
      },
    });

    if (hasSeoValues) {
      await tx.seoMetadata.create({
        data: {
          brandId: createdBrand.id,
          metaTitle: seo.metaTitle ? String(seo.metaTitle).trim() : null,
          metaDescription: seo.metaDescription ? String(seo.metaDescription).trim() : null,
          metaKeywords: seo.metaKeywords ? String(seo.metaKeywords).trim() : null,
          canonicalUrl: seo.canonicalUrl ? String(seo.canonicalUrl).trim() : null,
          ogTitle: seo.ogTitle ? String(seo.ogTitle).trim() : null,
          ogDescription: seo.ogDescription ? String(seo.ogDescription).trim() : null,
          ogImageUrl: seo.ogImageUrl ? String(seo.ogImageUrl).trim() : null,
          robots: seo.robots ? String(seo.robots).trim() : null,
        },
      });
    }

    if (Array.isArray(productIds) && productIds.length > 0) {
      await tx.product.updateMany({
        where: { id: { in: productIds } },
        data: { brandId: createdBrand.id },
      });
    }

    return createdBrand;
  });

  return { data: brand, status: 201 };
});
