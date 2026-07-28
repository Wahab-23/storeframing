import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

type ClearWishlistInput = {
    userId: string;
};

export async function clearWishlist({ userId }: ClearWishlistInput) {
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
        },
    });

    return {
        status: 200,
        message: "Wishlist cleared successfully.",
        data: {
            removedCount: deleted.count,
        },
    };
}
