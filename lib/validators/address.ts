import { z } from "zod";

export const addressTypeValues = [
    "BILLING",
    "SHIPPING",
    "BUSINESS",
    "OTHER",
] as const;

const baseAddressSchema = {
    type: z.enum(addressTypeValues).optional(),
    firstName: z.string().trim().min(2).max(100),
    lastName: z.string().trim().min(2).max(100),
    company: z.string().trim().max(150).nullable().optional(),
    addressLine1: z.string().trim().min(5).max(255),
    addressLine2: z.string().trim().max(255).nullable().optional(),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().max(100).nullable().optional(),
    postalCode: z.string().trim().max(20).nullable().optional(),
    countryCode: z.string().trim().length(2),
    phone: z.string().trim().min(7).max(20).nullable().optional(),
    isDefault: z.boolean().optional(),
};

export const createAddressSchema = z.object(baseAddressSchema);

export const updateAddressSchema = z
    .object(baseAddressSchema)
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });
