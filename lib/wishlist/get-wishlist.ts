import { prisma } from "@/lib/prisma";
import { wishlistItemInclude } from "@/lib/wishlist/constants";

type GetWishlistInput = {
    userId: string;
};

export async function getWishlist({ userId }: GetWishlistInput) {
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
            items: {
                orderBy: {
                    createdAt: "desc",
                },
                include: wishlistItemInclude,
            },
        },
    });

    return {
        status: 200,
        message: "Wishlist fetched successfully.",
        data: {
            wishlist,
        },
    };
}
