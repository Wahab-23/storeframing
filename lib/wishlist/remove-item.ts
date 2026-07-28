import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

type RemoveWishlistItemInput = {
    userId: string;
    body: {
        productId: string;
        listingId?: string | null;
    };
};

export async function removeWishlistItem({ userId, body }: RemoveWishlistItemInput) {
    const wishlist = await prisma.wishlist.findUnique({
        where: {
            userId,
        },
        select: {
            id: true,
        },
    });

    if (!wishlist) {
        throw new AppError(404, "Wishlist not found.");
    }

    const deleted = await prisma.wishlistItem.deleteMany({
        where: {
            wishlistId: wishlist.id,
            productId: body.productId,
            ...(body.listingId !== undefined
                ? { listingId: body.listingId ?? null }
                : {}),
        },
    });

    if (deleted.count === 0) {
        throw new AppError(404, "Wishlist item not found.");
    }

    return {
        status: 200,
        message: "Item removed from wishlist.",
        data: {
            removedCount: deleted.count,
        },
    };
}
