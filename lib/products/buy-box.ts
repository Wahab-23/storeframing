type BuyBoxSeller = {
    id: string;
    status: string;
    averageRating: number | null;
};

type BuyBoxInventory = {
    quantity: number;
    reservedQuantity: number;
};

export type BuyBoxOffer = {
    id: string;
    sellerId: string;
    price: number;
    compareAtPrice: number | null;
    listingStatus: string;
    seller: BuyBoxSeller;
    inventory: BuyBoxInventory | null;
    createdAt: Date;
    fulfilmentPriority?: number;
};

type BuyBoxResult<TOffer extends BuyBoxOffer> = {
    buyBox: TOffer | null;
    otherOffers: TOffer[];
};

function getAvailableInventory(
    inventory: BuyBoxInventory | null | undefined
) {
    if (!inventory) {
        return 0;
    }

    return Math.max(0, inventory.quantity - inventory.reservedQuantity);
}

function compareOffers(a: BuyBoxOffer, b: BuyBoxOffer) {
    if (a.price !== b.price) {
        return a.price - b.price;
    }

    const sellerRatingA = a.seller.averageRating ?? 0;
    const sellerRatingB = b.seller.averageRating ?? 0;

    if (sellerRatingA !== sellerRatingB) {
        return sellerRatingB - sellerRatingA;
    }

    const fulfilmentPriorityA = a.fulfilmentPriority ?? 0;
    const fulfilmentPriorityB = b.fulfilmentPriority ?? 0;

    if (fulfilmentPriorityA !== fulfilmentPriorityB) {
        return fulfilmentPriorityB - fulfilmentPriorityA;
    }

    return a.createdAt.getTime() - b.createdAt.getTime();
}

export function resolveBuyBox<TOffer extends BuyBoxOffer>(
    offers: TOffer[]
): BuyBoxResult<TOffer> {
    const eligibleOffers = offers.filter((offer) => {
        if (offer.listingStatus !== "ACTIVE") {
            return false;
        }

        if (offer.seller.status !== "ACTIVE") {
            return false;
        }

        return getAvailableInventory(offer.inventory) > 0;
    });

    const sortedOffers = [...eligibleOffers].sort(compareOffers);

    return {
        buyBox: sortedOffers[0] ?? null,
        otherOffers: sortedOffers.slice(1),
    };
}

export type VariantBuyBoxOffer = BuyBoxOffer & {
    variantId: string;
};

export function resolveVariantBuyBoxes(
    offers: VariantBuyBoxOffer[]
) {
    const grouped = new Map<string, VariantBuyBoxOffer[]>();

    for (const offer of offers) {
        const current = grouped.get(offer.variantId) ?? [];
        current.push(offer);
        grouped.set(offer.variantId, current);
    }

    return [...grouped.entries()].map(([variantId, variantOffers]) => {
        const result = resolveBuyBox(variantOffers);

        return {
            variantId,
            buyBox: result.buyBox,
            otherOffers: result.otherOffers,
        };
    });
}

