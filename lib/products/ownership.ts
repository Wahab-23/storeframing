import { AppError } from "@/lib/errors";

type ProductOwnershipRecord = {
    id: string;
    ownershipType: "PLATFORM" | "SELLER_EXCLUSIVE";
    ownerSellerId: string | null;
};

export function assertSellerCanCreateListing(
    product: ProductOwnershipRecord,
    sellerId: string
) {
    if (product.ownershipType === "SELLER_EXCLUSIVE") {
        if (!product.ownerSellerId) {
            throw new AppError(
                500,
                "Seller-exclusive product is missing an owner seller."
            );
        }

        if (product.ownerSellerId !== sellerId) {
            throw new AppError(
                403,
                "Only the owner seller can create a listing for this product."
            );
        }
    }

    return product;
}
