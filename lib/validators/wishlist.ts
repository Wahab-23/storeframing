import { z } from "zod";

export const addWishlistItemSchema = z.object({
    productId: z.string().cuid2(),
    listingId: z.string().cuid2().optional().nullable(),
});

export const removeWishlistItemSchema = z.object({
    productId: z.string().cuid2(),
    listingId: z.string().cuid2().optional().nullable(),
});
