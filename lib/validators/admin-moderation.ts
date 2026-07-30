import { z } from "zod";

const userStatusValues = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
const sellerStatusValues = ["ACTIVE", "SUSPENDED"] as const;
const productStatusValues = [
    "DRAFT",
    "ACTIVE",
    "INACTIVE",
    "ARCHIVED",
] as const;
const productVisibilityValues = ["VISIBLE", "HIDDEN"] as const;

export const adminUserStatusSchema = z.object({
    status: z.enum(userStatusValues),
});

export const adminSellerStatusSchema = z.object({
    status: z.enum(sellerStatusValues),
});

export const adminProductStatusSchema = z
    .object({
        status: z.enum(productStatusValues).optional(),
        visibility: z.enum(productVisibilityValues).optional(),
    })
    .refine((data) => Boolean(data.status || data.visibility), {
        message: "At least one field must be provided.",
    });

export const adminSellerApprovalSchema = z.object({});

export const adminSellerRejectionSchema = z.object({
    reason: z
        .string()
        .trim()
        .min(5, "Rejection reason must be at least 5 characters.")
        .max(1000),
});
