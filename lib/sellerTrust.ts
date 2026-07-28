import { Prisma, PrismaClient, SellerTrustBadge } from "@/generated/prisma/client";

const QUALIFYING_ORDER_COUNT = 10;
const QUALIFYING_REVIEW_COUNT = 10;
const MINIMUM_RATING_TO_EARN = 4.0;
const MINIMUM_RATING_TO_KEEP = 3.5;

export async function evaluateSellerTrustBadge(
    tx: PrismaClient | Prisma.TransactionClient,
    sellerId: string
) {
    const seller = await tx.seller.findUnique({
        where: {
            id: sellerId,
        },
        select: {
            id: true,
            status: true,
            trustBadge: true,
            completedOrderCount: true,
            positiveReviewCount: true,
            averageRating: true,
            trustBadgeAwardedAt: true,
        },
    });

    if (!seller) {
        throw new Error("Seller not found");
    }

    const averageRating = Number(seller.averageRating);

    const canEarnBadge =
        seller.status === "ACTIVE" &&
        averageRating >= MINIMUM_RATING_TO_EARN &&
        (
            seller.completedOrderCount >=
            QUALIFYING_ORDER_COUNT ||
            seller.positiveReviewCount >=
            QUALIFYING_REVIEW_COUNT
        );

    const shouldKeepBadge =
        seller.status === "ACTIVE" &&
        averageRating >= MINIMUM_RATING_TO_KEEP;

    // Badge is currently active
    if (seller.trustBadge === SellerTrustBadge.VERIFIED_SELLER) {
        if (shouldKeepBadge) {
            return {
                changed: false,
                badge: seller.trustBadge,
            };
        }

        const updatedSeller = await tx.seller.update({
            where: {
                id: sellerId,
            },
            data: {
                trustBadge: SellerTrustBadge.NONE,
                trustBadgeRemovedAt: new Date(),
            },
        });

        return {
            changed: true,
            action: "REMOVED",
            seller: updatedSeller,
        };
    }

    // Seller does not currently have badge
    if (canEarnBadge) {
        const updatedSeller = await tx.seller.update({
            where: {
                id: sellerId,
            },
            data: {
                trustBadge: SellerTrustBadge.VERIFIED_SELLER,
                trustBadgeAwardedAt: new Date(),
                trustBadgeRemovedAt: null,
            },
        });

        return {
            changed: true,
            action: "AWARDED",
            seller: updatedSeller,
        };
    }

    return {
        changed: false,
        badge: seller.trustBadge,
    };
}