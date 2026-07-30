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

const productOwnershipTypeValues = [
    "PLATFORM",
    "SELLER_EXCLUSIVE",
] as const;

const productVisibilityValues = [
    "VISIBLE",
    "HIDDEN",
] as const;

export const adminOverviewSchema = z.object({});

const basePaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),
});

export const adminUsersQuerySchema = basePaginationSchema.extend({
    status: z.enum(userStatusValues).optional(),
});

export const adminSellersQuerySchema = basePaginationSchema.extend({
    status: z.enum(sellerStatusValues).optional(),
    verificationStatus: z.enum(verificationStatusValues).optional(),
});

export const adminOrdersQuerySchema = basePaginationSchema.extend({
    status: z.enum(orderStatusValues).optional(),
});

export const adminProductsQuerySchema = basePaginationSchema.extend({
    status: z.enum(productStatusValues).optional(),
    ownershipType: z.enum(productOwnershipTypeValues).optional(),
    visibility: z.enum(productVisibilityValues).optional(),
});
