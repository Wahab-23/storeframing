import { z } from "zod";

const productTypeValues = [
    "SIMPLE",
    "VARIABLE",
    "DIGITAL",
    "VIRTUAL",
    "SERVICE",
    "BUNDLE",
] as const;

const listingConditionValues = [
    "NEW",
    "USED",
    "REFURBISHED",
    "OPEN_BOX",
] as const;

const nestedCategorySchema = z.object({
    categoryId: z.string().cuid2(),
});

const nestedImageSchema = z.object({
    url: z.string().trim().min(1).max(2048),
    altText: z.string().trim().max(500).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isPrimary: z.boolean().optional(),
});

const nestedAttributeValueSchema = z.object({
    attributeId: z.string().cuid2(),
    attributeValueId: z.string().cuid2().nullable().optional(),
    textValue: z.string().trim().max(5000).nullable().optional(),
    integerValue: z.number().int().nullable().optional(),
    decimalValue: z.number().nullable().optional(),
    booleanValue: z.boolean().nullable().optional(),
    dateValue: z.coerce.date().nullable().optional(),
    jsonValue: z.unknown().nullable().optional(),
});

const nestedVariantAttributeSchema = z.object({
    attributeId: z.string().cuid2(),
    attributeValueId: z.string().cuid2().nullable().optional(),
    textValue: z.string().trim().max(5000).nullable().optional(),
    integerValue: z.number().int().nullable().optional(),
    decimalValue: z.number().nullable().optional(),
    booleanValue: z.boolean().nullable().optional(),
    dateValue: z.coerce.date().nullable().optional(),
    jsonValue: z.unknown().nullable().optional(),
});

const nestedVariantSchema = z.object({
    name: z.string().trim().min(1).max(255),
    sku: z.string().trim().min(1).max(255),
    price: z.number().positive().optional(),
    compareAtPrice: z.number().positive().nullable().optional(),
    costPrice: z.number().positive().nullable().optional(),
    quantity: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    attributes: z.array(nestedVariantAttributeSchema).optional(),
});

const baseProductFields = {
    name: z.string().trim().min(1).max(255),
    slug: z.string().trim().min(1).max(255),
    description: z.string().trim().max(5000).nullable().optional(),
    shortDescription: z.string().trim().max(5000).nullable().optional(),
    brandId: z.string().cuid2().nullable().optional(),
    productType: z.enum(productTypeValues).optional(),
    modelNumber: z.string().trim().max(255).nullable().optional(),
    manufacturer: z.string().trim().max(255).nullable().optional(),
    countryOfOrigin: z.string().trim().max(255).nullable().optional(),
    categories: z.array(nestedCategorySchema).optional(),
    images: z.array(nestedImageSchema).optional(),
    attributes: z.array(nestedAttributeValueSchema).optional(),
    variants: z.array(nestedVariantSchema).optional(),
};

const baseListingFields = {
    sellerSku: z.string().trim().max(100).nullable().optional(),
    price: z.number().positive().optional(),
    compareAtPrice: z.number().positive().nullable().optional(),
    costPrice: z.number().positive().nullable().optional(),
    condition: z.enum(listingConditionValues).optional(),
    warrantyTitle: z.string().trim().max(255).nullable().optional(),
    warrantyDescription: z.string().trim().max(5000).nullable().optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    quantity: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
};

export const sellerProductSubmissionDraftSchema = z
    .object({
        ...baseProductFields,
        ...baseListingFields,
    })
    .partial();

export const sellerProductSubmissionSubmitSchema = z.object({
    ...baseProductFields,
    ...baseListingFields,
    price: z.number().positive(),
});

export const sellerProductRevisionPatchSchema = z
    .object({
        ...baseProductFields,
        ...baseListingFields,
    })
    .partial();

export const sellerProductRevisionApprovalSchema = z.object({
    ...baseProductFields,
    ...baseListingFields,
});

export const adminProductSubmissionDecisionSchema = z.object({
    reason: z
        .string()
        .trim()
        .min(5, "Reason must be at least 5 characters.")
        .max(1000)
        .optional(),
});

export const adminProductRevisionDecisionSchema = z.object({
    reason: z
        .string()
        .trim()
        .min(5, "Reason must be at least 5 characters.")
        .max(1000)
        .optional(),
});
