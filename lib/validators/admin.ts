import { z } from "zod";

const userStatusValues = [
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "DELETED",
] as const;

const sellerStatusValues = [
    "PENDING",
    "ACTIVE",
    "SUSPENDED",
    "REJECTED",
    "CLOSED",
] as const;

const verificationStatusValues = [
    "UNVERIFIED",
    "PENDING",
    "VERIFIED",
    "REJECTED",
] as const;

const orderStatusValues = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "PARTIALLY_SHIPPED",
    "SHIPPED",
    "PARTIALLY_DELIVERED",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
    "PARTIALLY_REFUNDED",
    "REFUNDED",
] as const;

const productStatusValues = [
    "DRAFT",
    "ACTIVE",
    "INACTIVE",
    "ARCHIVED",
] as const;

const productVisibilityValues = [
    "VISIBLE",
    "HIDDEN",
] as const;

export const adminOverviewSchema = z.object({});

export const adminUsersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(userStatusValues).optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export const adminSellersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(sellerStatusValues).optional(),
    verificationStatus: z.enum(verificationStatusValues).optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export const adminOrdersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(orderStatusValues).optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export const adminProductsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(productStatusValues).optional(),
    visibility: z.enum(productVisibilityValues).optional(),
    search: z.string().trim().min(1).max(100).optional(),
});
