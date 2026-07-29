import { z } from "zod";

export const reviewStatusValues = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "HIDDEN",
] as const;

export const productReviewsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    productId: z.string().cuid2().optional(),
});

export const createProductReviewSchema = z.object({
    productId: z.string().cuid2(),
    orderItemId: z.string().cuid2().optional(),
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().max(255).optional().nullable(),
    content: z.string().trim().max(5000).optional().nullable(),
});

export const sellerReviewsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sellerId: z.string().cuid2().optional(),
});

export const createSellerReviewSchema = z.object({
    sellerId: z.string().cuid2(),
    orderId: z.string().cuid2().optional(),
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().max(255).optional().nullable(),
    content: z.string().trim().max(5000).optional().nullable(),
});
