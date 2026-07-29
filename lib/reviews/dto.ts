export function serializeReviewBase(review: {
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
    status: string;
    verifiedPurchase: boolean;
    createdAt: Date;
    updatedAt?: Date;
}) {
    return {
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        status: review.status,
        verifiedPurchase: review.verifiedPurchase,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
    };
}
