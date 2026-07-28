import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { wishlistItemInclude } from "@/lib/wishlist/constants";
import { addWishlistItemSchema } from "@/lib/validators/wishlist";

type AddWishlistItemInput = {
    userId: string;
    body: unknown;
};

export async function addWishlistItem({ userId, body }: AddWishlistItemInput) {
    const parsed = addWishlistItemSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { productId, listingId } = parsed.data;

    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            deletedAt: null,
        },
        select: {
            id: true,
        },
    });

    if (!product) {
        throw new AppError(404, "Product not found.");
    }

    if (listingId) {
        const listing = await prisma.sellerListing.findFirst({
            where: {
                id: listingId,
                productId,
                deletedAt: null,
            },
            select: {
                id: true,
            },
        });

        if (!listing) {
            throw new AppError(404, "Listing not found.");
        }
    }

    const wishlist = await prisma.wishlist.upsert({
        where: {
            userId,
        },
        update: {},
        create: {
            userId,
        },
        select: {
            id: true,
        },
    });

    const existingItem = await prisma.wishlistItem.findFirst({
        where: {
            wishlistId: wishlist.id,
            productId,
            listingId: listingId ?? null,
        },
        select: {
            id: true,
        },
    });

    if (existingItem) {
        return {
            status: 200,
            message: "Item already saved to wishlist.",
            data: {
                item: existingItem,
            },
        };
    }

    const item = await prisma.wishlistItem.create({
        data: {
            wishlistId: wishlist.id,
            productId,
            listingId: listingId ?? null,
        },
        include: wishlistItemInclude,
    });

    return {
        status: 201,
        message: "Item added to wishlist.",
        data: {
            item,
        },
    };
}
