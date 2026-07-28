import { z } from "zod";

export const addCartItemSchema = z.object({
    listingId: z.string().cuid2(),

    listingVariantId: z.string().cuid2().optional().nullable(),

    quantity: z.number().int().min(1).max(100),
});

export const updateCartItemSchema = z.object({
    quantity: z.number().int().min(1).max(100),
});

export const mergeCartSchema = z.object({});
