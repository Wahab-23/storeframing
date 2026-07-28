import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function getSellerContext(userId: string) {
    const seller = await prisma.seller.findUnique({
        where: {
            userId,
        },
        select: {
            id: true,
            status: true,
            shopName: true,
            slug: true,
        },
    });

    if (!seller) {
        throw new AppError(404, "Seller profile not found.");
    }

    if (seller.status !== "ACTIVE") {
        throw new AppError(403, "Only active sellers can access wallet data.");
    }

    return seller;
}
