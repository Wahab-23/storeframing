import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiHandler } from "@/lib/api-handler";
import { requireAdminAccess } from "@/lib/admin/require-admin-access";

const DEFAULT_BLOCKS = [
  {
    title: "Category Hero Promo Banner",
    identifier: "category-hero-promo",
    position: "TOP",
    content: "Special seasonal discounts available on selected items. Limited time offers with verified seller warranties.",
    isActive: true,
  },
  {
    title: "Quality & Authenticity Guarantee",
    identifier: "quality-guarantee-badge",
    position: "TOP",
    content: "All products in this category are backed by Storeframing 100% Genuine Authenticity & Fast Dispatch Guarantee.",
    isActive: true,
  },
  {
    title: "Buyer Protection & Free Returns Notice",
    identifier: "buyer-protection-notice",
    position: "BOTTOM",
    content: "Enjoy hassle-free 7-day returns and direct vendor support on all catalog orders across Pakistan.",
    isActive: true,
  },
  {
    title: "Featured Brands Spotlight",
    identifier: "featured-brands-spotlight",
    position: "BOTTOM",
    content: "Explore top official brand flagship stores with exclusive bundle pricing and zero commission markup.",
    isActive: true,
  },
];

export const GET = withApiHandler(async (request: NextRequest) => {
  await requireAdminAccess(request);

  let blocks = await prisma.cmsBlock.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Seed default blocks if database table is currently empty
  if (blocks.length === 0) {
    for (const b of DEFAULT_BLOCKS) {
      await prisma.cmsBlock.upsert({
        where: { identifier: b.identifier },
        create: b,
        update: {},
      });
    }

    blocks = await prisma.cmsBlock.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  return {
    status: 200,
    message: "CMS blocks retrieved successfully.",
    data: blocks,
  };
});

export const POST = withApiHandler(async (request: NextRequest) => {
  await requireAdminAccess(request);
  const body = await request.json();

  const { title, identifier, content, position = "TOP", isActive = true } = body;

  if (!title || !identifier) {
    return {
      status: 400,
      message: "Title and identifier are required for CMS block.",
    };
  }

  const cleanIdentifier = identifier.toLowerCase().replace(/[^a-z0-9-_]+/g, "-");

  const block = await prisma.cmsBlock.create({
    data: {
      title,
      identifier: cleanIdentifier,
      content,
      position,
      isActive,
    },
  });

  return {
    status: 201,
    message: "CMS block created successfully.",
    data: block,
  };
});
