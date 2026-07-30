import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { resolveBuyBox, resolveVariantBuyBoxes } from "@/lib/products/buy-box";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const selectedVariantId = request.nextUrl.searchParams.get("variantId") ?? undefined;

    const product = await prisma.product.findFirst({
        where: {
            id,
            deletedAt: null,
        },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            shortDescription: true,
            ownershipType: true,
            status: true,
            visibility: true,
            productType: true,
            ownerSellerId: true,
            brand: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            seo: true,
            images: {
                orderBy: {
                    sortOrder: "asc",
                },
                select: {
                    id: true,
                    url: true,
                    altText: true,
                    sortOrder: true,
                    isPrimary: true,
                },
            },
            variants: {
                orderBy: {
                    createdAt: "asc",
                },
                select: {
                    id: true,
                    name: true,
                    sku: true,
                },
            },
            listings: {
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    createdAt: "asc",
                },
                select: {
                    id: true,
                    sellerId: true,
                    sellerSku: true,
                    price: true,
                    compareAtPrice: true,
                    condition: true,
                    status: true,
                    createdAt: true,
                    seller: {
                        select: {
                            id: true,
                            shopName: true,
                            slug: true,
                            status: true,
                            averageRating: true,
                        },
                    },
                    inventory: {
                        select: {
                            quantity: true,
                            reservedQuantity: true,
                        },
                    },
                    variants: {
                        select: {
                            id: true,
                            variantId: true,
                            price: true,
                            compareAtPrice: true,
                            inventory: {
                                select: {
                                    quantity: true,
                                    reservedQuantity: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!product) {
        throw new AppError(404, "Product not found.");
    }

    const defaultOffers = product.listings.map((listing) => ({
        id: listing.id,
        sellerId: listing.sellerId,
        price: Number(listing.price),
        compareAtPrice:
            listing.compareAtPrice === null
                ? null
                : Number(listing.compareAtPrice),
        listingStatus: listing.status,
        seller: {
            id: listing.seller.id,
            status: listing.seller.status,
            averageRating:
                listing.seller.averageRating === null
                    ? null
                    : Number(listing.seller.averageRating),
        },
        inventory: listing.inventory
            ? {
                  quantity: listing.inventory.quantity,
                  reservedQuantity: listing.inventory.reservedQuantity,
              }
            : null,
        createdAt: listing.createdAt,
    }));

    const productBuyBox =
        product.ownershipType === "SELLER_EXCLUSIVE"
            ? {
                  buyBox: defaultOffers[0] ?? null,
                  otherOffers: [],
              }
            : resolveBuyBox(defaultOffers);

    const selectedVariantOffers =
        selectedVariantId && product.ownershipType === "PLATFORM"
            ? product.listings.flatMap((listing) =>
                  listing.variants
                      .filter(
                          (variantListing) =>
                              variantListing.variantId === selectedVariantId
                      )
                      .map((variantListing) => ({
                          id: variantListing.id,
                          sellerId: listing.sellerId,
                          price: Number(variantListing.price),
                          compareAtPrice:
                              variantListing.compareAtPrice === null
                                  ? null
                                  : Number(variantListing.compareAtPrice),
                          listingStatus: listing.status,
                          seller: {
                              id: listing.seller.id,
                              status: listing.seller.status,
                              averageRating:
                                  listing.seller.averageRating === null
                                      ? null
                                      : Number(listing.seller.averageRating),
                          },
                          inventory: variantListing.inventory
                              ? {
                                    quantity: variantListing.inventory.quantity,
                                    reservedQuantity:
                                        variantListing.inventory.reservedQuantity,
                                }
                              : null,
                          createdAt: listing.createdAt,
                      }))
              )
            : [];

    const selectedVariantBuyBox =
        selectedVariantOffers.length > 0
            ? resolveBuyBox(selectedVariantOffers)
            : null;

    const variantBuyBoxes = resolveVariantBuyBoxes(
        product.variants.flatMap((variant) =>
            product.listings
                .flatMap((listing) =>
                    listing.variants
                        .filter(
                            (variantListing) =>
                                variantListing.variantId === variant.id
                        )
                        .map((variantListing) => ({
                            variantId: variant.id,
                            id: variantListing.id,
                            sellerId: listing.sellerId,
                            price: Number(variantListing.price),
                            compareAtPrice:
                                variantListing.compareAtPrice === null
                                    ? null
                                    : Number(variantListing.compareAtPrice),
                            listingStatus: listing.status,
                            seller: {
                                id: listing.seller.id,
                                status: listing.seller.status,
                                averageRating:
                                    listing.seller.averageRating === null
                                        ? null
                                        : Number(listing.seller.averageRating),
                            },
                            inventory: variantListing.inventory
                                ? {
                                      quantity: variantListing.inventory.quantity,
                                      reservedQuantity:
                                          variantListing.inventory.reservedQuantity,
                                  }
                                : null,
                            createdAt: listing.createdAt,
                        }))
                )
        )
    );

    return {
        data: {
            product,
            buyBox: selectedVariantBuyBox?.buyBox ?? productBuyBox.buyBox,
            otherOffers:
                selectedVariantBuyBox?.otherOffers ?? productBuyBox.otherOffers,
            variantBuyBoxes,
        },
    };
});
