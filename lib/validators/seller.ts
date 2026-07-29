import { z } from "zod";

export const sellerStatusValues = [
    "PENDING",
    "ACTIVE",
    "SUSPENDED",
    "REJECTED",
    "CLOSED",
] as const;

const sellerOrderStatusValues = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "READY_TO_SHIP",
    "SHIPPED",
    "PARTIALLY_DELIVERED",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
    "PARTIALLY_REFUNDED",
    "REFUNDED",
] as const;

export const publicSellersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),
});

export const sellerOrdersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(sellerOrderStatusValues).optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export const sellerOrderStatusSchema = z.object({
    status: z.enum(sellerOrderStatusValues),
});

export const sellerDashboardQuerySchema = z.object({});

export const sellerEarningsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
        .enum(["PENDING", "AVAILABLE", "PAID", "REVERSED"] as const)
        .optional(),
});

export const sellerReviewsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
        .enum(["PENDING", "APPROVED", "REJECTED", "HIDDEN"] as const)
        .optional(),
});

export const publicSellerReviewsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sellerId: z.string().cuid2().optional(),
});

export const publicSellerListQuerySchema = publicSellersQuerySchema;
